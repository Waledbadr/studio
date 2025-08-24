import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

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
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const mrvId = (form.get('mrvId') as string) || '';
    if (!file || !mrvId) {
      return NextResponse.json({ error: 'file and mrvId required' }, { status: 400 });
    }

    const db = getAdminDb();
    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const blobPath = `mrvs/receipts/${yy}/${m}/${mrvId}/${Date.now()}_${safeName}`;
    const attachmentRef = `${mrvId}/${safeName}`;

    const putRes = await put(blobPath, file as any, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN as string | undefined,
    } as any);

    // Update Firestore if Admin is configured (optional).
    let wroteToFirestore = false;
    if (db) {
      await db.collection('mrvs').doc(mrvId).set({
        attachmentUrl: putRes.url,
        attachmentPath: blobPath,
        attachmentRef,
        updatedAt: new Date(),
      }, { merge: true });
      wroteToFirestore = true;
    }

    return NextResponse.json({ url: putRes.url, path: blobPath, attachmentRef, wroteToFirestore });
  } catch (e: any) {
    console.error('MRV upload error:', e);
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}
