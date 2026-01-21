import { getRequestContext } from '@cloudflare/next-on-pages';

type RequestContext = {
  env?: Record<string, unknown>;
};

export function tryGetRequestContext(): RequestContext | null {
  try {
    return getRequestContext() as unknown as RequestContext;
  } catch {
    return null;
  }
}
