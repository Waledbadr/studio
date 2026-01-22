export function getCookieFromHeader(cookieHeader: string | null | undefined, name: string): string {
  if (!cookieHeader) return '';
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=');
    if (!k) continue;
    if (k === name) {
      const v = rest.join('=');
      try {
        return decodeURIComponent(v);
      } catch {
        return v;
      }
    }
  }
  return '';
}

export function getCookieFromRequest(req: Request, name: string): string {
  return getCookieFromHeader(req.headers.get('cookie'), name);
}
