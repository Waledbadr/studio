function normalizeBasePath(value: string) {
  const trimmed = (value || '').trim();
  if (!trimmed || trimmed === '/') return '';
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading;
}

const BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH || '');

export function withBasePath(path: string) {
  if (!path) return BASE_PATH || '';

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!BASE_PATH) return normalizedPath;

  if (normalizedPath === BASE_PATH) return normalizedPath;
  if (normalizedPath.startsWith(`${BASE_PATH}/`)) return normalizedPath;

  return `${BASE_PATH}${normalizedPath}`;
}

// Convenience helper for API route calls.
export function apiPath(path: string) {
  return withBasePath(path);
}
