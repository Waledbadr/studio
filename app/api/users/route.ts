/**
 * API لإدارة المستخدمين
 */

import { CloudflareDB, CloudflareEnv, User, AuthService, RegisterData } from '../_lib';

export const runtime = 'edge';

// GET - جلب جميع المستخدمين
export async function GET(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة والصلاحيات (إداري فقط)
    const authResult = await AuthService.requireAuth(request, env, 'admin');
    if (authResult instanceof Response) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const db = new CloudflareDB(env);
    let users = await db.getUsers(limit, offset);

    // فلترة حسب الدور إذا تم تحديده
    if (role) {
      users = users.filter(user => user.role === role);
    }

    // إزالة كلمات المرور من النتائج
    const safeUsers = users.map(user => {
      const { password_hash, ...safeUser } = user;
      return safeUser;
    });

    return Response.json({
      success: true,
      data: safeUsers,
      pagination: {
        page,
        limit,
        total: safeUsers.length
      }
    });

  } catch (error) {
    console.error('خطأ في API المستخدمين (GET):', error);
    return Response.json(
      { error: 'حدث خطأ في جلب بيانات المستخدمين' },
      { status: 500 }
    );
  }
}

// POST - إنشاء مستخدم جديد
export async function POST(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة والصلاحيات (إداري فقط)
    const authResult = await AuthService.requireAuth(request, env, 'admin');
    if (authResult instanceof Response) {
      return authResult;
    }

    const body = await request.json();
    
    // التحقق من صحة البيانات المطلوبة
    if (!body.name || !body.email || !body.password) {
      return Response.json(
        { error: 'الحقول المطلوبة: name, email, password' },
        { status: 400 }
      );
    }

    const authService = new AuthService(env);
    
    // إنشاء المستخدم الجديد
    const userData: RegisterData = {
      name: body.name,
      email: body.email,
      password: body.password,
      phone: body.phone,
      role: body.role || 'user'
    };

    const result = await authService.register(userData);
    
    if (!result) {
      return Response.json(
        { error: 'فشل في إنشاء المستخدم. قد يكون البريد الإلكتروني مستخدماً بالفعل' },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      data: { 
        id: result.user.id,
        email: result.user.email
      }
    });

  } catch (error) {
    console.error('خطأ في API المستخدمين (POST):', error);
    return Response.json(
      { error: 'حدث خطأ في إنشاء المستخدم' },
      { status: 500 }
    );
  }
}

// PUT - تحديث مستخدم
export async function PUT(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة
    const authResult = await AuthService.requireAuth(request, env);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return Response.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const db = new CloudflareDB(env);

    // التحقق من الصلاحيات - المستخدم يمكنه تحديث معلوماته أو الإداري يمكنه تحديث أي مستخدم
    if (authResult.user.id !== userId && authResult.user.role !== 'admin') {
      return Response.json(
        { error: 'ليس لديك صلاحية لتحديث هذا المستخدم' },
        { status: 403 }
      );
    }

    // التحقق من وجود المستخدم
    const existingUser = await db.getUserById(userId);
    if (!existingUser) {
      return Response.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // تحديث المستخدم
    const updateData: Partial<User> = {};
    
    // تحديث الحقول المرسلة فقط
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url;
    
    // فقط الإداري يمكنه تحديث الدور والحالة
    if (authResult.user.role === 'admin') {
      if (body.role !== undefined) updateData.role = body.role;
      if (body.is_active !== undefined) updateData.is_active = body.is_active;
    }

    await db.updateUser(userId, updateData);

    return Response.json({
      success: true,
      message: 'تم تحديث المستخدم بنجاح'
    });

  } catch (error) {
    console.error('خطأ في API المستخدمين (PUT):', error);
    return Response.json(
      { error: 'حدث خطأ في تحديث المستخدم' },
      { status: 500 }
    );
  }
}

// DELETE - حذف مستخدم (soft delete)
export async function DELETE(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة والصلاحيات (إداري فقط)
    const authResult = await AuthService.requireAuth(request, env, 'admin');
    if (authResult instanceof Response) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return Response.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // منع المستخدم من حذف نفسه
    if (authResult.user.id === userId) {
      return Response.json(
        { error: 'لا يمكنك حذف حسابك الخاص' },
        { status: 400 }
      );
    }

    const db = new CloudflareDB(env);

    // التحقق من وجود المستخدم
    const existingUser = await db.getUserById(userId);
    if (!existingUser) {
      return Response.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // حذف المستخدم (soft delete)
    await db.deleteUser(userId);

    return Response.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });

  } catch (error) {
    console.error('خطأ في API المستخدمين (DELETE):', error);
    return Response.json(
      { error: 'حدث خطأ في حذف المستخدم' },
      { status: 500 }
    );
  }
}
