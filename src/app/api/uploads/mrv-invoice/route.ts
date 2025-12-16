import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        {
          error: 'BLOB_READ_WRITE_TOKEN is not configured',
          hint: 'Set BLOB_READ_WRITE_TOKEN in your Render environment variables.',
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

    const { url } = await put(blobPath, body, {
      access: 'public',
      contentType: detectedType,
      token,
    } as any);

    return NextResponse.json({ url, path: blobPath });
  } catch (err: any) {
    console.error('Upload error', err);
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
