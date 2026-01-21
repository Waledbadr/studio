import { NextResponse } from 'next/server';

// Using local file storage via src/lib/storage.ts (no external blob provider required)


export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // Using local storage for file uploads (no external blob token required).

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

    const originalName = typeof (fileValue as any)?.name === 'string' ? (fileValue as any).name : 'upload.bin';
    const detectedType = typeof (fileValue as any)?.type === 'string' ? (fileValue as any).type : 'application/octet-stream';

    const arrayBuffer = await (fileValue as any).arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    const { saveBuffer } = await import('@/lib/storage');
    const saved = await saveBuffer({ buffer: body, dir: 'mrvs/invoices', filename: originalName, contentType: detectedType, maxSize, allowedTypes: ['application/pdf', 'image/'] });

    return NextResponse.json({ url: saved.url, path: saved.path });
  } catch (err: any) {
    console.error('[MRV Invoice Upload Error]', {
      message: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json({
      error: err?.message || 'فشل رفع الملف - Upload failed',
      hint: 'تأكد من إعداد Cloudflare R2 bindings (STORAGE_BUCKET).',
      details: err?.stack?.split('\n').slice(0, 3).join('\n'),
    }, { status: 500 });
  }
}
