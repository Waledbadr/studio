/**
 * API للطلبات - جلب وإدارة الطلبات
 */

import { CloudflareDB, CloudflareEnv, Order } from '../../../../lib/cloudflare-db';
import { AuthService } from '../../../../lib/auth';

export const runtime = 'edge';

// GET - جلب جميع الطلبات
export async function GET(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة
    const authResult = await AuthService.requireAuth(request, env);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const db = new CloudflareDB(env);

    let orders: Order[];

    if (status) {
      orders = await db.getOrdersByStatus(status);
    } else {
      orders = await db.getOrders(limit, offset);
    }

    return Response.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total: orders.length
      }
    });

  } catch (error) {
    console.error('خطأ في API الطلبات (GET):', error);
    return Response.json(
      { error: 'حدث خطأ في جلب بيانات الطلبات' },
      { status: 500 }
    );
  }
}

// POST - إنشاء طلب جديد
export async function POST(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة والصلاحيات
    const authResult = await AuthService.requireAuth(request, env, 'user');
    if (authResult instanceof Response) {
      return authResult;
    }

    const body = await request.json();
    
    // التحقق من صحة البيانات المطلوبة
    if (!body.customer_name || !body.order_type || !body.total_amount) {
      return Response.json(
        { error: 'الحقول المطلوبة: customer_name, order_type, total_amount' },
        { status: 400 }
      );
    }

    const db = new CloudflareDB(env);
    
    // إنشاء رقم طلب فريد
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // إنشاء الطلب الجديد
    const orderData: Omit<Order, 'created_at' | 'updated_at' | 'final_amount'> = {
      id: crypto.randomUUID(),
      order_number: orderNumber,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      customer_address: body.customer_address,
      order_type: body.order_type,
      status: 'pending',
      priority: body.priority || 'normal',
      total_amount: parseFloat(body.total_amount),
      discount_amount: parseFloat(body.discount_amount || '0'),
      tax_amount: parseFloat(body.tax_amount || '0'),
      payment_status: 'pending',
      payment_method: body.payment_method,
      currency: body.currency || 'SAR',
      delivery_date: body.delivery_date,
      delivery_address: body.delivery_address,
      assigned_to: body.assigned_to,
      notes: body.notes
    };

    await db.createOrder(orderData);

    return Response.json({
      success: true,
      message: 'تم إنشاء الطلب بنجاح',
      data: { 
        id: orderData.id,
        order_number: orderNumber
      }
    });

  } catch (error) {
    console.error('خطأ في API الطلبات (POST):', error);
    return Response.json(
      { error: 'حدث خطأ في إنشاء الطلب' },
      { status: 500 }
    );
  }
}

// PUT - تحديث طلب
export async function PUT(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة والصلاحيات
    const authResult = await AuthService.requireAuth(request, env, 'user');
    if (authResult instanceof Response) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return Response.json(
        { error: 'معرف الطلب مطلوب' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const db = new CloudflareDB(env);

    // التحقق من وجود الطلب
    const existingOrder = await db.getOrderById(orderId);
    if (!existingOrder) {
      return Response.json(
        { error: 'الطلب غير موجود' },
        { status: 404 }
      );
    }

    // تحديث الطلب
    const updateData: Partial<Order> = {};
    
    // تحديث الحقول المرسلة فقط
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.payment_status !== undefined) updateData.payment_status = body.payment_status;
    if (body.payment_method !== undefined) updateData.payment_method = body.payment_method;
    if (body.delivery_date !== undefined) updateData.delivery_date = body.delivery_date;
    if (body.delivery_address !== undefined) updateData.delivery_address = body.delivery_address;
    if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.discount_amount !== undefined) updateData.discount_amount = parseFloat(body.discount_amount);
    if (body.tax_amount !== undefined) updateData.tax_amount = parseFloat(body.tax_amount);

    await db.updateOrder(orderId, updateData);

    return Response.json({
      success: true,
      message: 'تم تحديث الطلب بنجاح'
    });

  } catch (error) {
    console.error('خطأ في API الطلبات (PUT):', error);
    return Response.json(
      { error: 'حدث خطأ في تحديث الطلب' },
      { status: 500 }
    );
  }
}
