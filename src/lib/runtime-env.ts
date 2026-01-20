type CloudflareEnv = Record<string, unknown>;
type GetRequestContextFn = () => any;

let cachedGetRequestContext: GetRequestContextFn | null | undefined;

async function loadGetRequestContext(): Promise<GetRequestContextFn | null> {
  if (cachedGetRequestContext !== undefined) return cachedGetRequestContext;
  try {
    const mod: any = await import('@cloudflare/next-on-pages');
    const fn = mod?.getRequestContext;
    cachedGetRequestContext = typeof fn === 'function' ? (fn as GetRequestContextFn) : null;
  } catch {
    cachedGetRequestContext = null;
  }
  return cachedGetRequestContext;
}

export async function getCloudflareEnvRecord(): Promise<CloudflareEnv | undefined> {
  const getRequestContext = await loadGetRequestContext();
  if (!getRequestContext) return undefined;
  try {
    const ctx = getRequestContext();
    const env = ctx?.env as CloudflareEnv | undefined;
    return env;
  } catch {
    return undefined;
  }
}

export async function getCloudflareBinding<T = unknown>(key: string): Promise<T | undefined> {
  const env = await getCloudflareEnvRecord();
  const value = env?.[key];
  return value as T | undefined;
}

async function tryGetCloudflareEnvString(key: string): Promise<string | undefined> {
  const value = await getCloudflareBinding<unknown>(key);
  return typeof value === 'string' ? value : value == null ? undefined : String(value);
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
  const fromCf = await tryGetCloudflareEnvString(key);
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
