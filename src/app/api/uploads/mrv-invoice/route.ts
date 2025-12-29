import { NextResponse } from 'next/server';

let cachedPut: null | ((...args: any[]) => Promise<any>) = null;

async function getBlobPut() {
  if (cachedPut) return cachedPut;

  if (typeof (globalThis as any).File === 'undefined') {
    try {
      const undici = await import('undici');
      (globalThis as any).File = (undici as any).File;
      (globalThis as any).Blob = (undici as any).Blob;
      (globalThis as any).FormData = (undici as any).FormData;
    } catch {
      // ignore
    }
  }

  const mod = await import('@vercel/blob');
  cachedPut = (mod as any).put;
  return cachedPut;
}

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error('[MRV Invoice Upload] BLOB_READ_WRITE_TOKEN not found');
      return NextResponse.json(
        {
          error: 'تكوين التخزين غير مكتمل - BLOB_READ_WRITE_TOKEN is not configured',
          hint: 'يجب إضافة BLOB_READ_WRITE_TOKEN في متغيرات البيئة في Render Dashboard',
          docs: 'راجع RENDER_UPLOAD_FIX_AR.md',
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

    const originalName = typeof (fileValue as any)?.name === 'string' ? (fileValue as any).name : 'upload.bin';
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const detectedType = typeof (fileValue as any)?.type === 'string' ? (fileValue as any).type : 'application/octet-stream';
    const blobPath = `mrvs/invoices/${Date.now()}_${safeName}`;

    const arrayBuffer = await (fileValue as any).arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    const put = await getBlobPut();

    const { url } = await put(blobPath, body, {
      access: 'public',
      contentType: detectedType,
      token,
    } as any);

    return NextResponse.json({ url, path: blobPath });
  } catch (err: any) {
    console.error('[MRV Invoice Upload Error]', {
      message: err?.message,
      stack: err?.stack,
      hasToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    });
    return NextResponse.json({
      error: err?.message || 'فشل رفع الملف - Upload failed',
      hint: 'تحقق من إعدادات Vercel Blob وصلاحية Token',
      details: err?.stack?.split('\n').slice(0, 3).join('\n'),
    }, { status: 500 });
  }
}
