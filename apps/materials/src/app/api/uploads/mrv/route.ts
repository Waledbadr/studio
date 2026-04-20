import { NextRequest, NextResponse } from 'next/server';
import { getD1Db } from '@/lib/firebase-admin';
import { isR2Configured, uploadToR2 } from '@/lib/r2-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getD1Db();
    const r2Configured = isR2Configured();
    return NextResponse.json({
      ok: true,
      adminConfigured: Boolean(db),
      r2Configured,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isR2Configured()) {
      console.error('[MRV Upload] R2 bucket is not configured');
      return NextResponse.json(
        {
          error: 'تكوين التخزين غير مكتمل - R2 bucket غير مهيّأ',
          hint: 'أضف ربط R2_BUCKET في wrangler.jsonc ثم أعد النشر',
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

    const db = getD1Db();
    const safeName = originalName.replace(/[^\w.\-]+/g, '_');
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const blobPath = `mrvs/receipts/${yy}/${m}/${mrvId}/${Date.now()}_${safeName}`;
    const attachmentRef = `${mrvId}/${safeName}`;

    const arrayBuffer = await (fileValue as any).arrayBuffer();
    const body = new Uint8Array(arrayBuffer);

    const putRes = await uploadToR2(blobPath, body, undefined, contentType);

    const attachmentUrl = `/api/files/${blobPath}`;

    // Update Firestore if Admin is configured (optional).
    let wroteToFirestore = false;
    if (db) {
      await db.collection('mrvs').doc(mrvId).set({
        attachmentUrl,
        attachmentPath: blobPath,
        attachmentRef,
        updatedAt: new Date(),
      }, { merge: true });
      wroteToFirestore = true;
    }

    return NextResponse.json({ url: attachmentUrl, path: blobPath, attachmentRef, wroteToFirestore });
  } catch (e: any) {
    console.error('[MRV Upload Error]', {
      message: e?.message,
      stack: e?.stack,
    });
    return NextResponse.json({
      error: e?.message || 'فشل رفع المرفق - Upload failed',
      hint: 'تحقق من أن ربط R2_BUCKET موجود وأنه يعمل',
      solution: 'راجع إعدادات Cloudflare R2 في wrangler.jsonc',
    }, { status: 500 });
  }
}
