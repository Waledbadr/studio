/**
 * Centralized backend error messages for D1/Cloudflare configuration issues
 */

export function getBackendErrorMessage(): string {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return (
      "D1 backend connection error. Please ensure D1 bindings are linked in " +
      "Cloudflare Pages Settings > Functions > D1 Bindings. " +
      "See CLOUDFLARE_PAGES_DEPLOYMENT.md for setup instructions."
    );
  }

  return (
    "Backend is not configured. Please ensure D1 bindings are available " +
    "(and NEXT_PUBLIC_USE_D1=true if required)."
  );
}

export function getBackendErrorDescription(): string {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return (
      "The D1 database binding is not configured in your Cloudflare Pages project. " +
      "Follow the setup guide to link D1."
    );
  }

  return "Check that D1 is enabled and bindings are properly configured.";
}
