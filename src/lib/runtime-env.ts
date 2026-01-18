let cachedNextOnPages: any | null | undefined;

async function tryGetCloudflareEnv(key: string): Promise<string | undefined> {
  if (cachedNextOnPages === undefined) {
    try {
      cachedNextOnPages = await import('@cloudflare/next-on-pages');
    } catch {
      cachedNextOnPages = null;
    }
  }

  const getRequestContext = cachedNextOnPages?.getRequestContext as undefined | (() => any);
  if (!getRequestContext) return undefined;

  try {
    const ctx = getRequestContext();
    const env = ctx?.env as Record<string, unknown> | undefined;
    const value = env?.[key];
    return typeof value === 'string' ? value : value == null ? undefined : String(value);
  } catch {
    return undefined;
  }
}

function tryGetProcessEnv(key: string): string | undefined {
  try {
    // eslint-disable-next-line no-undef
    const env = typeof process !== 'undefined' ? (process as any).env : undefined;
    const value = env?.[key];
    return typeof value === 'string' ? value : value == null ? undefined : String(value);
  } catch {
    return undefined;
  }
}

/**
 * Get environment variable from Cloudflare context or process.env
 * Priority: Cloudflare env (for edge runtime) > process.env (for Node.js runtime)
 * This ensures proper behavior in both Cloudflare Edge and local development
 */
export async function getRuntimeEnv(key: string, fallback?: string): Promise<string> {
  // Try Cloudflare context first (Edge Runtime)
  const fromCf = await tryGetCloudflareEnv(key);
  if (fromCf !== undefined && fromCf !== '') return fromCf;

  // Fall back to process.env (Node.js or dev)
  const fromProcess = tryGetProcessEnv(key);
  if (fromProcess !== undefined && fromProcess !== '') return fromProcess;

  return fallback ?? '';
}

/**
 * Synchronous version for non-async contexts
 * Only checks process.env, suitable for build-time or initialization
 */
export function getRuntimeEnvSync(key: string, fallback?: string): string {
  const fromProcess = tryGetProcessEnv(key);
  return fromProcess !== undefined && fromProcess !== '' ? fromProcess : fallback ?? '';
}

export function isHttpsRequest(req: Request): boolean {
  try {
    const url = new URL(req.url);
    if (url.protocol === 'https:') return true;
  } catch {
    // ignore
  }

  const forwardedProto = req.headers.get('x-forwarded-proto');
  return forwardedProto === 'https';
}
