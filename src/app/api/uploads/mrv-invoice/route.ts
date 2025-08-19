import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Basic validation
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 413 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const blobPath = `mrvs/invoices/${Date.now()}_${safeName}`;

    const { url } = await put(blobPath, file, {
      access: 'public',
      // Ensure the Vercel Blob token is provided in all environments
      token: process.env.BLOB_READ_WRITE_TOKEN as string | undefined,
    } as any);

    return NextResponse.json({ url, path: blobPath });
  } catch (err: any) {
    console.error('Upload error', err);
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
