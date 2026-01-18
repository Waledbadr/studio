import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// Using local file storage via src/lib/storage.ts (no external blob provider required)


export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
  const db = getAdminDb();
    const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    return NextResponse.json({
      ok: true,
      adminConfigured: Boolean(db),
      blobConfigured,
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

    const db = getAdminDb();
    const safeName = originalName.replace(/[^\w.\-]+/g, '_');
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const blobPath = `mrvs/receipts/${yy}/${m}/${mrvId}/${Date.now()}_${safeName}`;
    const attachmentRef = `${mrvId}/${safeName}`;

    const arrayBuffer = await (fileValue as any).arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    // Validate and save locally
    const { saveBuffer } = await import('@/lib/storage');
    const saved = await saveBuffer({ buffer: body, dir: `mrvs/receipts/${mrvId}`, filename: originalName, contentType, maxSize, allowedTypes: ['image/', 'application/pdf'] });

    // Update Firestore if Admin is configured (optional).
    let wroteToFirestore = false;
    if (db) {
      await db.collection('mrvs').doc(mrvId).set({
        attachmentUrl: saved.url,
        attachmentPath: saved.path,
        attachmentRef,
        updatedAt: new Date(),
      }, { merge: true });
      wroteToFirestore = true;
    }

    return NextResponse.json({ url: saved.url, path: saved.path, attachmentRef, wroteToFirestore });
  } catch (e: any) {
    console.error('[MRV Upload Error]', {
      message: e?.message,
      stack: e?.stack,
      hasToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    });
    return NextResponse.json({
      error: e?.message || 'فشل رفع المرفق - Upload failed',
      hint: 'تأكد من إضافة BLOB_READ_WRITE_TOKEN في Render Environment',
      solution: 'راجع RENDER_UPLOAD_FIX_AR.md للحل الكامل',
    }, { status: 500 });
  }
}
