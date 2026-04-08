import { NextResponse } from 'next/server';
import { getD1Db } from '@/lib/firebase-admin';
import { getR2Bucket } from '@/lib/r2-client';

/**
 * Diagnostics endpoint to check upload configuration
 * Access at: /api/uploads/diagnostics
 */

export async function GET() {
  const r2Bucket = getR2Bucket();
  const d1Configured = Boolean(getD1Db());
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    runtime: 'cloudflare-r2',
    checks: {
      r2Bucket: {
        configured: Boolean(r2Bucket),
        status: r2Bucket ? '✅' : '❌',
      },
      d1: {
        configured: Boolean(d1Configured),
        status: d1Configured ? '✅' : '❌',
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

  if (!diagnostics.checks.r2Bucket.configured) {
    diagnostics.recommendations.push(
      '❌ تأكد من أن R2_BUCKET مرتبط بشكل صحيح في wrangler.jsonc',
      '📖 أضف R2 bucket binding باسم R2_BUCKET ثم انشر من جديد',
      '🔑 يمكنك استخدام R2 bucket من Cloudflare Dashboard'
    );
  } else {
    diagnostics.recommendations.push('✅ R2 bucket مرتبط بشكل صحيح');
  }

  if (!diagnostics.checks.d1.configured) {
    diagnostics.recommendations.push(
      '❌ تأكد من أن D1 binding موجود في wrangler.jsonc',
      '📖 أضف D1 binding باسم D1 ثم أعد نشر المشروع'
    );
  } else {
    diagnostics.recommendations.push('✅ D1 database متاح');
  }

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
