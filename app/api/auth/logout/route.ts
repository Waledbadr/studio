/**
 * API للمصادقة - تسجيل الخروج
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // إنشاء response لحذف session cookie
    const response = NextResponse.json({
      message: 'تم تسجيل الخروج بنجاح'
    });

    // حذف auth-token cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // انتهاء فوري
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('خطأ في API تسجيل الخروج:', error);
    return NextResponse.json(
      { error: 'حدث خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}
