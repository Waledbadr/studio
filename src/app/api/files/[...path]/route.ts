import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { getCloudflareEnvRecord } from '@/lib/runtime-env';

// export const runtime = 'edge';
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
      await verifyAccessToken(t);
    } catch (e) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const parts = await params;
    const pathParts = parts.path || [];
    const r2Key = pathParts.map(p => decodeURIComponent(p)).join('/');

    if (!r2Key) return new NextResponse('Not found', { status: 404 });

    const env = await getCloudflareEnvRecord();
    const bucket = (env as any)?.STORAGE_BUCKET;
    
    let responseBody: any;
    const headers = new Headers();

    if (bucket) {
      const object = await bucket.get(r2Key);
      if (!object) return new NextResponse('File not found', { status: 404 });
      
      responseBody = object.body;
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
    } else {
      // Local fallback
      try {
        const fs = await import('fs');
        const path = await import('path');
        const localPath = path.join(process.cwd(), '.local-storage', r2Key);
        
        try {
          await fs.promises.access(localPath);
        } catch {
          return new NextResponse('File not found', { status: 404 });
        }
        
        const data = await fs.promises.readFile(localPath);
        responseBody = data;
        
        // Simple MIME type inference for dev
        const ext = path.extname(localPath).toLowerCase();
        const mimeMap: Record<string, string> = {
          '.png': 'image/png',
          '.jpg': 'image/jpeg', 
          '.jpeg': 'image/jpeg',
          '.pdf': 'application/pdf',
          '.txt': 'text/plain'
        };
        if (mimeMap[ext]) headers.set('content-type', mimeMap[ext]);
      } catch (e) {
        console.error('Local storage read failed:', e);
        return new NextResponse('Storage configuration error', { status: 500 });
      }
    }

    if (!headers.has('cache-control')) {
        headers.set('cache-control', 'private, max-age=3600'); // Cache for 1 hour
    }

    return new NextResponse(responseBody, { headers });
  } catch (e: any) {
    console.error('[File Serve Error]', e?.message);
    return new NextResponse('Server error', { status: 500 });
  }
}
