import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Diagnostics endpoint to check upload configuration
 * Access at: /api/uploads/diagnostics
 */
export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    runtime: 'nodejs',
    checks: {
      storageRoot: {
        configured: Boolean(process.env.STORAGE_ROOT || process.env.STORAGE_PATH || process.env.STORAGE_DIR),
        root: process.env.STORAGE_ROOT || process.env.STORAGE_PATH || process.env.STORAGE_DIR || 'default ./storage',
        status: (process.env.STORAGE_ROOT || process.env.STORAGE_PATH || process.env.STORAGE_DIR) ? '✅' : '⚠️ (using ./storage)',
      },
      firebaseConfig: {
        apiKey: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT SET',
        status: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅' : '❌',
      },
      geminiApi: {
        configured: Boolean(process.env.GEMINI_API_KEY),
        status: process.env.GEMINI_API_KEY ? '✅' : '❌',
      },
    },
    uploadEndpoints: {
      'order-approval': '/api/uploads/order-approval',
      'mrv-invoice': '/api/uploads/mrv-invoice',
      'mrv': '/api/uploads/mrv',
      'feedback': '/api/uploads/feedback',
    },
    recommendations: [] as string[],
  };

  // Add recommendations based on checks
  if (!diagnostics.checks.storageRoot.configured) {
    diagnostics.recommendations.push(
      '⚠️ لم يتم تحديد مجلد التخزين - سيتم استخدام ./storage محلياً. ضع STORAGE_ROOT في متغيرات البيئة للإشارة إلى مسار ثابت مثل /var/estatecare/storage',
      '📖 راجع وثائق التخزين المحلية لتحديد الصلاحيات إن لزم',
    );
  } else {
    diagnostics.recommendations.push(`✅ Storage root: ${diagnostics.checks.storageRoot.root}`);
  }

  if (!diagnostics.checks.firebaseConfig.apiKey) {
    diagnostics.recommendations.push('⚠️ Firebase API Key غير محدد');
  }

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
