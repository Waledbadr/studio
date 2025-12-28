import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

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
      blobToken: {
        configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
        value: process.env.BLOB_READ_WRITE_TOKEN 
          ? `${process.env.BLOB_READ_WRITE_TOKEN.substring(0, 20)}...` 
          : 'NOT SET',
        status: process.env.BLOB_READ_WRITE_TOKEN ? '✅' : '❌',
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
  if (!diagnostics.checks.blobToken.configured) {
    diagnostics.recommendations.push(
      '❌ أضف BLOB_READ_WRITE_TOKEN في متغيرات البيئة في Render Dashboard',
      '📖 راجع ملف RENDER_UPLOAD_FIX_AR.md للخطوات الكاملة',
      '🔑 احصل على Token من: Vercel Dashboard → Storage → Blob → Tokens'
    );
  } else {
    diagnostics.recommendations.push('✅ BLOB_READ_WRITE_TOKEN محدد بشكل صحيح');
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
