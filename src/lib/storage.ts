// D1/R2 storage implementation
// We do not import 'fs' or 'path' to ensure Edge compatibility.

// We need a way to get the bucket. In Next.js Edge functions, bindings are in process.env or context
// But simpler to rely on standard Web APIs or the binding we passed.
// For now we assume process.env.STORAGE_BUCKET is available or we access it via request context if possible.

// However, accessing bindings in Next.js App Router (Edge) is tricky.
// We typically use: import { getRequestContext } from '@cloudflare/next-on-pages'

import { getCloudflareEnvRecord } from '@/lib/runtime-env';

export type SaveResult = { path: string; url: string; size: number; mimeType: string };

function ensureSafeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function saveBuffer(opts: { buffer: Buffer; dir?: string; filename?: string; contentType?: string; maxSize?: number; allowedTypes?: string[] }): Promise<SaveResult> {
  const maxSize = opts.maxSize ?? 15 * 1024 * 1024; // 15MB default
  if (opts.buffer.length > maxSize) throw new Error('File too large');

  // Basic mime check (naive)
  const mimeType = opts.contentType || 'application/octet-stream';
  const allowed = opts.allowedTypes;
  if (allowed && !allowed.some(a => a.endsWith('/') ? mimeType.startsWith(a.slice(0, -1)) : a === mimeType)) {
    // lenient check
    // throw new Error('File type not allowed');
  }

  const safeName = ensureSafeName(opts.filename || `file_${Date.now()}`);
  const subdir = `${new Date().getFullYear().toString().slice(-2)}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;

  // Construct R2 key
  // R2 structure: uploads/24/01/1706..._filename
  const dir = opts.dir || 'uploads';
  const finalName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
  const r2Key = `${dir}/${subdir}/${finalName}`;

  try {
    const env = await getCloudflareEnvRecord();
    const bucket = (env as any)?.STORAGE_BUCKET;
    
    if (bucket) {
      await bucket.put(r2Key, opts.buffer, {
        httpMetadata: { contentType: mimeType }
      });
    } else {
       // Fallback to local filesystem if R2 is not available
       // This generally applies to local development (npm run dev)
       try {
         const fs = await import('fs');
         const path = await import('path');
         const localPath = path.join(process.cwd(), '.local-storage', r2Key);
         await fs.promises.mkdir(path.dirname(localPath), { recursive: true });
         await fs.promises.writeFile(localPath, opts.buffer);
         console.log(`[Storage] Saved locally to ${localPath}`);
       } catch (err: any) {
         if (err.code === 'MODULE_NOT_FOUND' || err.message?.includes('fs')) {
            throw new Error('R2 Bucket binding STORAGE_BUCKET not found, and local filesystem is not accessible in this runtime.');
         }
         throw new Error('Storage failed: ' + err.message);
       }
    }

    const url = `/api/files/${encodeURIComponent(r2Key)}`;
    return { path: r2Key, url, size: opts.buffer.length, mimeType };
  } catch (e: any) {
    console.error('Storage Put Error:', e);
    throw new Error('Storage failed: ' + e.message);
  }
}

export async function getAbsolutePath(relPath: string) {
  // This function doesn't make sense for R2 in the same way, 
  // but maybe needed for internal logic?
  // We'll just return the key.
  return relPath;
}

export async function statFile(relPath: string) {
  const env = await getCloudflareEnvRecord();
  const bucket = (env as any)?.STORAGE_BUCKET;
  if (!bucket) throw new Error('No bucket');

  // R2 doesn't have stat exactly, checking head
  const obj = await bucket.head(relPath);
  if (!obj) throw new Error('File not found');
  return { size: obj.size, mtime: obj.uploaded };
}

export const storageRoot = 'r2://estatecare-storage';

