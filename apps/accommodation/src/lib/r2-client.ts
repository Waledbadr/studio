export type R2BucketBinding = {
  put: (key: string, value: BodyInit, options?: { httpMetadata?: { contentType?: string } }) => Promise<any>;
  get: (key: string) => Promise<{
    body: ReadableStream<Uint8Array> | null;
    httpMetadata?: { contentType?: string; contentDisposition?: string };
  } | null>;
};

export function getR2Bucket(env?: any): R2BucketBinding | null {
  const binding = env?.R2_BUCKET ?? (globalThis as any).R2_BUCKET ?? (globalThis as any).R2 ??
    (typeof process !== 'undefined' ? (process.env as any).R2_BUCKET : undefined) ?? null;
  return binding && typeof binding !== 'string' ? binding : null;
}

export function isR2Configured(env?: any): boolean {
  return Boolean(getR2Bucket(env));
}

export async function uploadToR2(
  key: string,
  data: BodyInit,
  env?: any,
  contentType?: string,
) {
  const bucket = getR2Bucket(env);
  if (!bucket) {
    throw new Error('R2 bucket is not configured');
  }
  return bucket.put(key, data, contentType ? { httpMetadata: { contentType } } : undefined);
}
