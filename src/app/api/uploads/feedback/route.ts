import { NextRequest, NextResponse } from 'next/server';
import { LocalCloudflareDB } from '../../../../lib/local-db';

export async function POST(req: NextRequest) {
  try {
    const body: { dataUrl?: string } = await req.json();
    const { dataUrl } = body;
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image' }, { status: 400 });
    }

    // Decode base64
    const base64 = dataUrl.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');

    // Create a File object from the buffer
    const filename = `feedback-${Date.now()}-${Math.random().toString(36).slice(2,8)}.png`;
    const file = new File([buffer], filename, { type: 'image/png' });

    // Use LocalCloudflareDB for local development
    const db = new LocalCloudflareDB();

    // For now, we'll store the file metadata in the database
    // In production, this would use the actual Cloudflare R2 service
    const fileId = crypto.randomUUID();
    const r2Key = `feedback/${fileId}.png`;

    // Store file metadata (in a real implementation, the file would be uploaded to R2)
    const fileMetadata = {
      id: fileId,
      filename: filename,
      original_name: filename,
      mime_type: 'image/png',
      size_bytes: buffer.length,
      r2_key: r2Key,
      public_url: `https://your-bucket.r2.cloudflarestorage.com/${r2Key}`,
      entity_type: 'feedback',
      entity_id: null,
      uploaded_by: null,
      is_public: true,
      created_at: new Date().toISOString()
    };

    // Save metadata to database
    await db.saveFileMetadata(fileMetadata);

    return NextResponse.json({ url: fileMetadata.public_url });
  } catch (e: any) {
    console.error('Upload error:', e);
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}
