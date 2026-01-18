import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAbsolutePath } from '@/lib/storage';
import fs from 'fs';
import { verifyAccessToken } from '@/lib/auth';
const mimeLookup: any = require('mime-types').lookup;

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const token = req.headers.get('cf-access-jwt-assertion') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/, '') || '';
    // Also accept cookie
    if (!token) {
      const cookieToken = req.cookies.get?.('access_token')?.value || '';
      if (cookieToken) {
        // allow cookie token
      }
    }

    // Try verify: if verification fails, return 401
    try {
      const t = token || req.cookies.get?.('access_token')?.value || '';
      if (!t) throw new Error('No token');
      verifyAccessToken(t);
    } catch (e) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const parts = params.path || [];
    const relPath = parts.map(p => decodeURIComponent(p)).join('/');
    if (!relPath) return new NextResponse('Not found', { status: 404 });

    const abs = await getAbsolutePath(relPath);
    if (!fs.existsSync(abs)) return new NextResponse('Not found', { status: 404 });

    const stream = fs.createReadStream(abs);
    const mtype = mimeLookup(abs) || 'application/octet-stream';
    return new NextResponse(stream, { status: 200, headers: { 'content-type': String(mtype), 'cache-control': 'private, max-age=0, no-cache' } });
  } catch (e: any) {
    console.error('[File Serve Error]', e?.message);
    return new NextResponse('Server error', { status: 500 });
  }
}
