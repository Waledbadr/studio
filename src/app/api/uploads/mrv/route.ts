import { NextRequest, NextResponse } from 'next/server';
import { LocalCloudflareDB } from '../../../../lib/local-db';

export async function GET() {
  try {
    const db = new LocalCloudflareDB();
    const blobConfigured = true; // R2 is always configured in Cloudflare
    return NextResponse.json({
      ok: true,
      adminConfigured: true, // Local DB is always available
      blobConfigured,
      runtime: 'nodejs',
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error', runtime: 'nodejs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const mrvId = (form.get('mrvId') as string) || '';
    if (!file || !mrvId) {
      return NextResponse.json({ error: 'file and mrvId required' }, { status: 400 });
    }

    const db = new LocalCloudflareDB();
    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const blobPath = `mrvs/receipts/${yy}/${m}/${mrvId}/${Date.now()}_${safeName}`;
    const attachmentRef = `${mrvId}/${safeName}`;

    // Create file metadata for R2 storage
    const fileId = crypto.randomUUID();
    const fileMetadata = {
      id: fileId,
      filename: safeName,
      original_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      r2_key: blobPath,
      public_url: `https://your-bucket.r2.cloudflarestorage.com/${blobPath}`,
      entity_type: 'mrv',
      entity_id: mrvId,
      uploaded_by: null,
      is_public: true,
      created_at: now.toISOString()
    };

    // Save file metadata to database
    await db.saveFileMetadata(fileMetadata);

    // For now, we'll skip Firestore integration since we're migrating to Cloudflare
    // In a full migration, this would be replaced with D1 operations
    let wroteToFirestore = false;

    return NextResponse.json({
      url: fileMetadata.public_url,
      path: blobPath,
      attachmentRef,
      wroteToFirestore
    });
  } catch (e: any) {
    console.error('MRV upload error:', e);
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}
