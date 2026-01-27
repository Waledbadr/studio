import { NextRequest, NextResponse } from 'next/server';

// export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
  const { dataUrl } = body;
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image' }, { status: 400 });
    }

    // Decode base64
    const base64 = dataUrl.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');
    const originalName = `feedback-${Date.now()}.png`;

    const { saveBuffer } = await import('@/lib/storage');
    const saved = await saveBuffer({ buffer, dir: 'feedback', filename: originalName, contentType: 'image/png', maxSize: 2 * 1024 * 1024, allowedTypes: ['image/'] });

    return NextResponse.json({ url: saved.url, path: saved.path });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}
