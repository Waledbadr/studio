import { NextResponse } from 'next/server';
import { LocalCloudflareDB } from '../../../../lib/local-db';

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

    const db = new LocalCloudflareDB();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const blobPath = `mrvs/invoices/${Date.now()}_${safeName}`;

    // Create file metadata for R2 storage
    const fileId = crypto.randomUUID();
    const now = new Date();
    const fileMetadata = {
      id: fileId,
      filename: safeName,
      original_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      r2_key: blobPath,
      public_url: `https://your-bucket.r2.cloudflarestorage.com/${blobPath}`,
      entity_type: 'mrv-invoice',
      entity_id: null,
      uploaded_by: null,
      is_public: true,
      created_at: now.toISOString()
    };

    // Save file metadata to database
    await db.saveFileMetadata(fileMetadata);

    return NextResponse.json({ url: fileMetadata.public_url, path: blobPath });
  } catch (err: any) {
    console.error('Upload error', err);
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
