import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2-client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { dataUrl } = await req.json();
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image' }, { status: 400 });
    }

    // Decode base64
    const base64 = dataUrl.split(',')[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const filename = `feedback/${Date.now()}-${Math.random().toString(36).slice(2,8)}.png`;

    await uploadToR2(filename, bytes, undefined, 'image/png');
    return NextResponse.json({ url: `/api/files/${filename}` });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}
