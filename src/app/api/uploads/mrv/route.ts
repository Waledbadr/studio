import { NextRequest, NextResponse } from 'next/server';
import * as D1Actions from '@/lib/d1-actions';
import { getCloudflareEnvRecord } from '@/lib/runtime-env';

// Using local file storage via src/lib/storage.ts (no external blob provider required)


export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const env = await getCloudflareEnvRecord();
    return NextResponse.json({
      ok: true,
      d1Configured: Boolean(env && (env as any).DB),
      runtime,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error', runtime }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Using local storage; ensure storage root is writable (STORAGE_ROOT env or ./storage)
    // No external blob token required anymore.

    const form = await req.formData();
    const fileValue = form.get('file');
    const mrvId = (form.get('mrvId') as string) || '';
    if (!fileValue || !mrvId) {
      return NextResponse.json({ error: 'file and mrvId required' }, { status: 400 });
    }

    const hasArrayBuffer = typeof (fileValue as any)?.arrayBuffer === 'function';
    if (!hasArrayBuffer) {
      return NextResponse.json({ error: 'Invalid file payload' }, { status: 400 });
    }

    const originalName = typeof (fileValue as any)?.name === 'string' ? (fileValue as any).name : 'upload.bin';
    const contentType = typeof (fileValue as any)?.type === 'string' ? (fileValue as any).type : 'application/octet-stream';
    const size = typeof (fileValue as any)?.size === 'number' ? (fileValue as any).size : 0;
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 413 });
    }

    const safeName = originalName.replace(/[^\w.\-]+/g, '_');
    const attachmentRef = `${mrvId}/${safeName}`;

    const arrayBuffer = await (fileValue as any).arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    // Validate and save locally
    const { saveBuffer } = await import('@/lib/storage');
    const saved = await saveBuffer({ buffer: body, dir: `mrvs/receipts/${mrvId}`, filename: originalName, contentType, maxSize, allowedTypes: ['image/', 'application/pdf'] });

    // Update D1 MRV record (best-effort)
    const env = await getCloudflareEnvRecord();
    if (env && (env as any).DB) {
      await D1Actions.updateMRVAttachment(env, mrvId, {
        attachmentUrl: saved.url,
        attachmentPath: saved.path,
        attachmentRef,
      });
    }

    return NextResponse.json({ url: saved.url, path: saved.path, attachmentRef });
  } catch (e: any) {
    console.error('[MRV Upload Error]', {
      message: e?.message,
      stack: e?.stack,
    });
    return NextResponse.json({
      error: e?.message || 'فشل رفع المرفق - Upload failed',
      hint: 'تأكد من إعداد Cloudflare R2 bindings (STORAGE_BUCKET) وتشغيل التطبيق عبر Cloudflare Pages dev عند التطوير المحلي.',
    }, { status: 500 });
  }
}
