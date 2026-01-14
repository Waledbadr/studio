import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
const mimeLookup: any = require('mime-types').lookup;

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

const DEFAULT_ROOT = process.env.STORAGE_ROOT || path.join(process.cwd(), 'storage');
const ROOT = path.resolve(DEFAULT_ROOT);

export type SaveResult = { path: string; url: string; size: number; mimeType: string };

function ensureSafeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function ensureDirExists(dir: string) {
  return mkdir(dir, { recursive: true });
}

export async function saveBuffer(opts: { buffer: Buffer; dir?: string; filename?: string; contentType?: string; maxSize?: number; allowedTypes?: string[] }): Promise<SaveResult> {
  const dir = opts.dir || 'uploads';
  const maxSize = opts.maxSize ?? 15 * 1024 * 1024; // 15MB default
  if (opts.buffer.length > maxSize) throw new Error('File too large');

  const mimeType = opts.contentType || mimeLookup(opts.filename || '') || 'application/octet-stream';
  const allowed = opts.allowedTypes;
  if (allowed && !allowed.some(a => a.endsWith('/') ? mimeType.startsWith(a) : a === mimeType)) {
    throw new Error('File type not allowed');
  }

  const safeName = ensureSafeName(opts.filename || `file_${Date.now()}`);
  const subdir = path.join(dir, new Date().getFullYear().toString().slice(-2), (new Date().getMonth()+1).toString().padStart(2,'0'));
  const relDir = path.join(subdir);
  const finalDir = path.join(ROOT, relDir);
  await ensureDirExists(finalDir);

  const finalName = `${Date.now()}_${Math.random().toString(36).slice(2,8)}_${safeName}`;
  const finalPath = path.join(finalDir, finalName);
  await writeFile(finalPath, opts.buffer, { mode: 0o600 });

  const relPath = path.posix.join(relDir.split(path.sep).join('/'), finalName);
  const url = `/api/files/${encodeURIComponent(relPath)}`;

  return { path: relPath, url, size: opts.buffer.length, mimeType: String(mimeType) };
}

export async function getAbsolutePath(relPath: string) {
  // prevent traversal
  if (relPath.includes('..')) throw new Error('Invalid path');
  const abs = path.join(ROOT, ...relPath.split('/'));
  if (!abs.startsWith(ROOT)) throw new Error('Invalid path');
  return abs;
}

export async function statFile(relPath: string) {
  const abs = await getAbsolutePath(relPath);
  return await stat(abs);
}

export { ROOT as storageRoot };
