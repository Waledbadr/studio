import { NextResponse } from 'next/server';
import { getR2Bucket } from '@/lib/r2-client';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { key: string[] } }) {
  const key = Array.isArray(params.key) ? params.key.join('/') : params.key;
  if (!key) {
    return NextResponse.json({ error: 'Missing file key' }, { status: 400 });
  }

  const bucket = getR2Bucket();
  if (!bucket) {
    return NextResponse.json({ error: 'R2 bucket is not configured' }, { status: 500 });
  }

  try {
    const object = await bucket.get(key);
    if (!object || !object.body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const headers = new Headers();
    if (object.httpMetadata?.contentType) {
      headers.set('Content-Type', object.httpMetadata.contentType);
    } else {
      headers.set('Content-Type', 'application/octet-stream');
    }
    if (object.httpMetadata?.contentDisposition) {
      headers.set('Content-Disposition', object.httpMetadata.contentDisposition);
    }

    return new NextResponse(object.body, { headers });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
