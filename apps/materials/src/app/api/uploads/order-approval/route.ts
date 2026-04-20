import { NextResponse } from 'next/server';
import { isR2Configured, uploadToR2 } from '@/lib/r2-client';

export async function POST(req: Request) {
  try {
    if (!isR2Configured()) {
      console.error('[Upload Error] R2 bucket is not configured');
      return NextResponse.json(
        {
          error: 'تكوين التخزين غير مكتمل - R2 bucket غير مهيّأ',
          hint: 'أضف ربط R2_BUCKET في wrangler.jsonc ثم أعد النشر',
        },
        { status: 500 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const formData = await req.formData();
    const fileValue = formData.get('file');

    const hasArrayBuffer = typeof (fileValue as any)?.arrayBuffer === 'function';
    if (!fileValue || !hasArrayBuffer) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Basic validation
    const maxSize = 15 * 1024 * 1024; // 15MB
    const size = typeof (fileValue as any)?.size === 'number' ? (fileValue as any).size : 0;
    if (size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 413 });
    }

    // Sanitize filename
    const originalName = typeof (fileValue as any)?.name === 'string' ? (fileValue as any).name : 'upload.bin';
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const detectedType = typeof (fileValue as any)?.type === 'string' ? (fileValue as any).type : 'application/octet-stream';
    const blobPath = `orders/approvals/${Date.now()}_${safeName}`;

    const arrayBuffer = await (fileValue as any).arrayBuffer();
    const body = new Uint8Array(arrayBuffer);
    const putRes = await uploadToR2(blobPath, body, undefined, detectedType);
    const url = `/api/files/${blobPath}`;
    return NextResponse.json({
      url,
      path: blobPath,
      filename: originalName,
    });
  } catch (err: any) {
    console.error('[Upload Error]', {
      message: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json({
      error: err?.message || 'فشل رفع الملف - Upload failed',
      hint: 'تحقق من أن ربط R2_BUCKET موجود وأنه يعمل',
      details: err?.stack?.split('\n').slice(0, 3).join('\n'),
    }, { status: 500 });
  }
}
