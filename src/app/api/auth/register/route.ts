import { NextRequest, NextResponse } from 'next/server';
import { LocalAuthService } from '@/lib/auth-local';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    const authService = new LocalAuthService();
    const result = await authService.register({
      name,
      email,
      password,
      role: 'user' // الدور الافتراضي للمستخدمين الجدد
    });

    if (!result) {
      return NextResponse.json(
        { error: 'فشل في إنشاء الحساب. قد يكون البريد الإلكتروني مستخدماً بالفعل' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'تم إنشاء الحساب بنجاح',
      user: result.user
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
