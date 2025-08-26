/**
 * API للمخزون - جلب وإدارة عناصر المخزون
 */

import { CloudflareDB, CloudflareEnv, InventoryItem } from '../../../../lib/cloudflare-db';
import { AuthService } from '../../../../lib/auth';

export const runtime = 'edge';

// GET - جلب جميع عناصر المخزون
export async function GET(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة
    const authResult = await AuthService.requireAuth(request, env);
    if (authResult instanceof Response) {
      return authResult; // خطأ في المصادقة
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const db = new CloudflareDB(env);

    let inventory: InventoryItem[];

    if (search) {
      inventory = await db.searchInventory(search, category || undefined);
    } else if (category) {
      inventory = await db.getInventoryByCategory(category);
    } else {
      inventory = await db.getInventory(limit, offset);
    }

    return Response.json({
      success: true,
      data: inventory,
      pagination: {
        page,
        limit,
        total: inventory.length
      }
    });

  } catch (error) {
    console.error('خطأ في API المخزون (GET):', error);
    return Response.json(
      { error: 'حدث خطأ في جلب بيانات المخزون' },
      { status: 500 }
    );
  }
}

// POST - إضافة عنصر جديد للمخزون
export async function POST(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة والصلاحيات
    const authResult = await AuthService.requireAuth(request, env, 'user');
    if (authResult instanceof Response) {
      return authResult;
    }

    const body = await request.json();
    
    // التحقق من صحة البيانات المطلوبة
    if (!body.name || !body.category || body.quantity === undefined || !body.unit_of_measure) {
      return Response.json(
        { error: 'الحقول المطلوبة: name, category, quantity, unit_of_measure' },
        { status: 400 }
      );
    }

    const db = new CloudflareDB(env);
    
    // إنشاء عنصر المخزون الجديد
    const itemData: Omit<InventoryItem, 'created_at' | 'updated_at' | 'total_value'> = {
      id: crypto.randomUUID(),
      name: body.name,
      description: body.description,
      category: body.category,
      subcategory: body.subcategory,
      sku: body.sku,
      barcode: body.barcode,
      quantity: parseInt(body.quantity),
      unit_of_measure: body.unit_of_measure,
      unit_price: body.unit_price ? parseFloat(body.unit_price) : undefined,
      minimum_stock: parseInt(body.minimum_stock || '0'),
      maximum_stock: body.maximum_stock ? parseInt(body.maximum_stock) : undefined,
      supplier_name: body.supplier_name,
      supplier_contact: body.supplier_contact,
      purchase_date: body.purchase_date,
      expiry_date: body.expiry_date,
      location: body.location,
      condition_status: body.condition_status || 'new',
      image_url: body.image_url,
      notes: body.notes,
      is_active: true
    };

    await db.createInventoryItem(itemData);

    return Response.json({
      success: true,
      message: 'تم إضافة العنصر بنجاح',
      data: { id: itemData.id }
    });

  } catch (error) {
    console.error('خطأ في API المخزون (POST):', error);
    return Response.json(
      { error: 'حدث خطأ في إضافة عنصر المخزون' },
      { status: 500 }
    );
  }
}

// PUT - تحديث عنصر المخزون
export async function PUT(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة والصلاحيات
    const authResult = await AuthService.requireAuth(request, env, 'user');
    if (authResult instanceof Response) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return Response.json(
        { error: 'معرف العنصر مطلوب' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const db = new CloudflareDB(env);

    // التحقق من وجود العنصر
    const existingItem = await db.getInventoryById(itemId);
    if (!existingItem) {
      return Response.json(
        { error: 'العنصر غير موجود' },
        { status: 404 }
      );
    }

    // تحديث العنصر
    const updateData: Partial<InventoryItem> = {};
    
    // تحديث الحقول المرسلة فقط
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.subcategory !== undefined) updateData.subcategory = body.subcategory;
    if (body.quantity !== undefined) updateData.quantity = parseInt(body.quantity);
    if (body.unit_price !== undefined) updateData.unit_price = parseFloat(body.unit_price);
    if (body.minimum_stock !== undefined) updateData.minimum_stock = parseInt(body.minimum_stock);
    if (body.location !== undefined) updateData.location = body.location;
    if (body.condition_status !== undefined) updateData.condition_status = body.condition_status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    await db.updateInventoryItem(itemId, updateData);

    return Response.json({
      success: true,
      message: 'تم تحديث العنصر بنجاح'
    });

  } catch (error) {
    console.error('خطأ في API المخزون (PUT):', error);
    return Response.json(
      { error: 'حدث خطأ في تحديث عنصر المخزون' },
      { status: 500 }
    );
  }
}

// DELETE - حذف عنصر المخزون (soft delete)
export async function DELETE(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة والصلاحيات
    const authResult = await AuthService.requireAuth(request, env, 'manager');
    if (authResult instanceof Response) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return Response.json(
        { error: 'معرف العنصر مطلوب' },
        { status: 400 }
      );
    }

    const db = new CloudflareDB(env);

    // التحقق من وجود العنصر
    const existingItem = await db.getInventoryById(itemId);
    if (!existingItem) {
      return Response.json(
        { error: 'العنصر غير موجود' },
        { status: 404 }
      );
    }

    // حذف العنصر (soft delete)
    await db.deleteInventoryItem(itemId);

    return Response.json({
      success: true,
      message: 'تم حذف العنصر بنجاح'
    });

  } catch (error) {
    console.error('خطأ في API المخزون (DELETE):', error);
    return Response.json(
      { error: 'حدث خطأ في حذف عنصر المخزون' },
      { status: 500 }
    );
  }
}
