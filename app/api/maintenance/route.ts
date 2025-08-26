/**
 * API لطلبات الصيانة - جلب وإدارة طلبات الصيانة
 */

import { CloudflareDB, CloudflareEnv, MaintenanceRequest, AuthService } from '../_lib';

export const runtime = 'edge';

// GET - جلب جميع طلبات الصيانة
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

    let requests: MaintenanceRequest[];

    if (status) {
      requests = await db.getMaintenanceRequestsByStatus(status);
    } else {
      requests = await db.getMaintenanceRequests(limit, offset);
    }

    return Response.json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total: requests.length
      }
    });

  } catch (error) {
    console.error('خطأ في API طلبات الصيانة (GET):', error);
    return Response.json(
      { error: 'حدث خطأ في جلب بيانات طلبات الصيانة' },
      { status: 500 }
    );
  }
}

// POST - إنشاء طلب صيانة جديد
export async function POST(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة والصلاحيات
    const authResult = await AuthService.requireAuth(request, env, 'user');
    if (authResult instanceof Response) {
      return authResult;
    }

    const body = await request.json();
    
    // التحقق من صحة البيانات المطلوبة
    if (!body.residence_id || !body.title || !body.description || !body.category) {
      return Response.json(
        { error: 'الحقول المطلوبة: residence_id, title, description, category' },
        { status: 400 }
      );
    }

    const db = new CloudflareDB(env);
    
    // التحقق من وجود العقار
    const residence = await db.getResidenceById(body.residence_id);
    if (!residence) {
      return Response.json(
        { error: 'العقار غير موجود' },
        { status: 404 }
      );
    }

    // إنشاء رقم طلب صيانة فريد
    const requestNumber = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // إنشاء طلب الصيانة الجديد
    const requestData: Omit<MaintenanceRequest, 'created_at' | 'updated_at'> = {
      id: crypto.randomUUID(),
      request_number: requestNumber,
      residence_id: body.residence_id,
      tenant_id: body.tenant_id,
      title: body.title,
      description: body.description,
      category: body.category,
      priority: body.priority || 'normal',
      status: 'pending',
      assigned_to: body.assigned_to,
      estimated_cost: body.estimated_cost ? parseFloat(body.estimated_cost) : undefined,
      actual_cost: undefined,
      estimated_completion: body.estimated_completion,
      completion_date: undefined,
      tenant_rating: undefined,
      tenant_feedback: undefined,
      images: body.images ? JSON.stringify(body.images) : undefined,
      before_images: undefined,
      after_images: undefined,
      required_materials: body.required_materials ? JSON.stringify(body.required_materials) : undefined,
      work_log: JSON.stringify([])
    };

    await db.createMaintenanceRequest(requestData);

    return Response.json({
      success: true,
      message: 'تم إنشاء طلب الصيانة بنجاح',
      data: { 
        id: requestData.id,
        request_number: requestNumber
      }
    });

  } catch (error) {
    console.error('خطأ في API طلبات الصيانة (POST):', error);
    return Response.json(
      { error: 'حدث خطأ في إنشاء طلب الصيانة' },
      { status: 500 }
    );
  }
}

// PUT - تحديث طلب صيانة
export async function PUT(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة والصلاحيات
    const authResult = await AuthService.requireAuth(request, env, 'user');
    if (authResult instanceof Response) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return Response.json(
        { error: 'معرف طلب الصيانة مطلوب' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const db = new CloudflareDB(env);

    // التحقق من وجود طلب الصيانة
    const existingRequest = await db.getMaintenanceRequestById(requestId);
    if (!existingRequest) {
      return Response.json(
        { error: 'طلب الصيانة غير موجود' },
        { status: 404 }
      );
    }

    // تحديث طلب الصيانة
    const updateData: Partial<MaintenanceRequest> = {};
    
    // تحديث الحقول المرسلة فقط
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to;
    if (body.estimated_cost !== undefined) updateData.estimated_cost = parseFloat(body.estimated_cost);
    if (body.actual_cost !== undefined) updateData.actual_cost = parseFloat(body.actual_cost);
    if (body.estimated_completion !== undefined) updateData.estimated_completion = body.estimated_completion;
    if (body.completion_date !== undefined) updateData.completion_date = body.completion_date;
    if (body.tenant_rating !== undefined) updateData.tenant_rating = parseInt(body.tenant_rating);
    if (body.tenant_feedback !== undefined) updateData.tenant_feedback = body.tenant_feedback;
    if (body.after_images !== undefined) updateData.after_images = JSON.stringify(body.after_images);
    
    // إضافة إدخال جديد في سجل العمل
    if (body.work_entry) {
      const currentWorkLog = existingRequest.work_log ? JSON.parse(existingRequest.work_log) : [];
      currentWorkLog.push({
        timestamp: new Date().toISOString(),
        entry: body.work_entry,
        user: authResult.user.name
      });
      updateData.work_log = JSON.stringify(currentWorkLog);
    }

    await db.updateMaintenanceRequest(requestId, updateData);

    return Response.json({
      success: true,
      message: 'تم تحديث طلب الصيانة بنجاح'
    });

  } catch (error) {
    console.error('خطأ في API طلبات الصيانة (PUT):', error);
    return Response.json(
      { error: 'حدث خطأ في تحديث طلب الصيانة' },
      { status: 500 }
    );
  }
}
