/**
 * API للعقارات - جلب وإدارة العقارات
 */

import { CloudflareDB, CloudflareEnv, Residence, AuthService } from '../_lib';

export const runtime = 'edge';

// GET - جلب جميع العقارات
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

    let residences: Residence[];

    if (status) {
      residences = await db.getResidencesByStatus(status);
    } else {
      residences = await db.getResidences(limit, offset);
    }

    return Response.json({
      success: true,
      data: residences,
      pagination: {
        page,
        limit,
        total: residences.length
      }
    });

  } catch (error) {
    console.error('خطأ في API العقارات (GET):', error);
    return Response.json(
      { error: 'حدث خطأ في جلب بيانات العقارات' },
      { status: 500 }
    );
  }
}

// POST - إضافة عقار جديد
export async function POST(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة والصلاحيات
    const authResult = await AuthService.requireAuth(request, env, 'manager');
    if (authResult instanceof Response) {
      return authResult;
    }

    const body = await request.json();
    
    // التحقق من صحة البيانات المطلوبة
    if (!body.address || !body.property_type || !body.rent_amount) {
      return Response.json(
        { error: 'الحقول المطلوبة: address, property_type, rent_amount' },
        { status: 400 }
      );
    }

    const db = new CloudflareDB(env);
    
    // إنشاء العقار الجديد
    const residenceData: Omit<Residence, 'created_at' | 'updated_at'> = {
      id: crypto.randomUUID(),
      address: body.address,
      unit_number: body.unit_number,
      building_name: body.building_name,
      floor_number: body.floor_number ? parseInt(body.floor_number) : undefined,
      property_type: body.property_type,
      area_sqm: body.area_sqm ? parseFloat(body.area_sqm) : undefined,
      bedrooms: body.bedrooms ? parseInt(body.bedrooms) : undefined,
      bathrooms: body.bathrooms ? parseInt(body.bathrooms) : undefined,
      rent_amount: parseFloat(body.rent_amount),
      deposit_amount: body.deposit_amount ? parseFloat(body.deposit_amount) : undefined,
      utilities_included: body.utilities_included || false,
      tenant_id: body.tenant_id,
      lease_start_date: body.lease_start_date,
      lease_end_date: body.lease_end_date,
      status: body.status || 'available',
      description: body.description,
      amenities: body.amenities ? JSON.stringify(body.amenities) : undefined,
      images: body.images ? JSON.stringify(body.images) : undefined
    };

    await db.createResidence(residenceData);

    return Response.json({
      success: true,
      message: 'تم إضافة العقار بنجاح',
      data: { id: residenceData.id }
    });

  } catch (error) {
    console.error('خطأ في API العقارات (POST):', error);
    return Response.json(
      { error: 'حدث خطأ في إضافة العقار' },
      { status: 500 }
    );
  }
}

// PUT - تحديث عقار
export async function PUT(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة والصلاحيات
    const authResult = await AuthService.requireAuth(request, env, 'manager');
    if (authResult instanceof Response) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const residenceId = searchParams.get('id');

    if (!residenceId) {
      return Response.json(
        { error: 'معرف العقار مطلوب' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const db = new CloudflareDB(env);

    // التحقق من وجود العقار
    const existingResidence = await db.getResidenceById(residenceId);
    if (!existingResidence) {
      return Response.json(
        { error: 'العقار غير موجود' },
        { status: 404 }
      );
    }

    // تحديث العقار
    const updateData: Partial<Residence> = {};
    
    // تحديث الحقول المرسلة فقط
    if (body.address !== undefined) updateData.address = body.address;
    if (body.unit_number !== undefined) updateData.unit_number = body.unit_number;
    if (body.rent_amount !== undefined) updateData.rent_amount = parseFloat(body.rent_amount);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.tenant_id !== undefined) updateData.tenant_id = body.tenant_id;
    if (body.lease_start_date !== undefined) updateData.lease_start_date = body.lease_start_date;
    if (body.lease_end_date !== undefined) updateData.lease_end_date = body.lease_end_date;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.utilities_included !== undefined) updateData.utilities_included = body.utilities_included;

    await db.updateResidence(residenceId, updateData);

    return Response.json({
      success: true,
      message: 'تم تحديث العقار بنجاح'
    });

  } catch (error) {
    console.error('خطأ في API العقارات (PUT):', error);
    return Response.json(
      { error: 'حدث خطأ في تحديث العقار' },
      { status: 500 }
    );
  }
}
