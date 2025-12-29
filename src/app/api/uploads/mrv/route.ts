import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

let cachedPut: null | ((...args: any[]) => Promise<any>) = null;

async function getBlobPut() {
  if (cachedPut) return cachedPut;

  // Some Node runtimes (e.g., Render) don't provide global File/Blob.
  // @vercel/blob may access File.prototype during module init.
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
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error('[MRV Upload] BLOB_READ_WRITE_TOKEN not configured in environment');
      return NextResponse.json(
        {
          error: 'تكوين التخزين غير مكتمل - BLOB_READ_WRITE_TOKEN is not configured',
          hint: 'أضف BLOB_READ_WRITE_TOKEN في Render Environment Variables',
          solution: 'راجع ملف RENDER_UPLOAD_FIX_AR.md للخطوات الكاملة',
        },
        { status: 500 }
      );
    }

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

    const put = await getBlobPut();

    const putRes = await put(blobPath, body, {
      access: 'public',
      contentType,
      token,
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
