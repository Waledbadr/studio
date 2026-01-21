import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Diagnostics endpoint to check upload configuration
 * Access at: /api/uploads/diagnostics
 */
export async function GET() {
  const safeEnv: Record<string, string | undefined> =
    typeof process !== 'undefined' && (process as any)?.env ? ((process as any).env as any) : {};

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: safeEnv.NODE_ENV || 'unknown',
    runtime: 'nodejs',
    checks: {
      storageRoot: {
        configured: Boolean(safeEnv.STORAGE_ROOT || safeEnv.STORAGE_PATH || safeEnv.STORAGE_DIR),
        root: safeEnv.STORAGE_ROOT || safeEnv.STORAGE_PATH || safeEnv.STORAGE_DIR || 'default ./storage',
        status: (safeEnv.STORAGE_ROOT || safeEnv.STORAGE_PATH || safeEnv.STORAGE_DIR) ? '✅' : '⚠️ (using ./storage)',
      },
      geminiApi: {
        configured: Boolean(safeEnv.GEMINI_API_KEY),
        status: safeEnv.GEMINI_API_KEY ? '✅' : '❌',
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

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
