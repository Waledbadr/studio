/**
 * API للمصادقة - تسجيل الدخول
 */

import { NextRequest, NextResponse } from 'next/server';
import { LocalAuthService } from '@/lib/auth-local';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email: string; password: string };
    const { email, password } = body;
    
    // التحقق من صحة البيانات
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // إنشاء خدمة المصادقة
    const authService = new LocalAuthService();
    
    // محاولة تسجيل الدخول
    const result = await authService.login({ email, password });
    
    if (!result) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // إنشاء response مع cookie للجلسة
    const response = NextResponse.json({
      message: 'تم تسجيل الدخول بنجاح',
      user: result.user
    });

    // إضافة cookie للتوكن
    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 أيام
    });

    return response;
    
  } catch (error) {
    console.error('خطأ في API تسجيل الدخول:', error);
    return NextResponse.json(
      { error: 'حدث خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}
