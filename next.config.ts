import type {NextConfig} from 'next';

if (process.env.NODE_ENV === 'development' && process.env.SKIP_CLOUDFLARE_SETUP !== 'true') {
  (async () => {
    try {
      const { setupDevPlatform } = await import('@cloudflare/next-on-pages/next-dev');
      await setupDevPlatform();
    } catch (e) {
      console.warn('Failed to setup Cloudflare dev platform', e);
    }
  })();
}

const RENDER_GIT_BRANCH = process.env.RENDER_GIT_BRANCH;
const RENDER_GIT_COMMIT = process.env.RENDER_GIT_COMMIT;
const BUILD_TIME_ISO = new Date().toISOString();

// NEXT_PUBLIC_* vars are baked into the bundle at build time.
// If NEXT_PUBLIC_USE_D1 is missing, D1 mode will be silently disabled in production.
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_USE_D1) {
  console.warn(
    '\n⚠️  WARNING: NEXT_PUBLIC_USE_D1 is not set.\n' +
    '   D1 backend will be disabled in this build.\n' +
    '   Add NEXT_PUBLIC_USE_D1=true as a Build Variable in\n' +
    '   Cloudflare Pages > Settings > Environment Variables.\n'
  );
}

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable source maps in production to avoid fetch errors
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    const proxyOrigin = process.env.DEV_API_PROXY_ORIGIN;
    if (process.env.NODE_ENV === 'development' && proxyOrigin) {
      return [
        {
          source: '/api/:path*',
          destination: `${proxyOrigin}/api/:path*`,
        },
      ];
    }
    return [];
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const baseHeaders = [
      { key: 'Permissions-Policy', value: 'clipboard-read=(self), clipboard-write=(self)' },
    ] as { key: string; value: string }[];
    const securityHeaders = isProd
      ? [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ]
      : [];

    return [
      {
        source: '/(.*)',
        headers: [...baseHeaders, ...securityHeaders],
      },
    ];
  },
  // Expose git info to client at build time (Render provides RENDER_GIT_*)
  env: {
    NEXT_PUBLIC_GIT_BRANCH: process.env.NEXT_PUBLIC_GIT_BRANCH ?? RENDER_GIT_BRANCH ?? 'production',
    NEXT_PUBLIC_LAST_COMMIT_HASH: process.env.NEXT_PUBLIC_LAST_COMMIT_HASH ?? RENDER_GIT_COMMIT ?? '',
    NEXT_PUBLIC_LAST_COMMIT_DATE: process.env.NEXT_PUBLIC_LAST_COMMIT_DATE ?? BUILD_TIME_ISO,
  },
};

// For local Next.js development with Cloudflare D1 / next-on-pages, ensure the dev platform
// shim is initialized so getRequestContext() works in dev. This is a no-op in production and
// safely requires the internal helper only in development to avoid compile-time issues.
let _export = nextConfig as any;
if (process.env.NODE_ENV === 'development' && process.env.SKIP_CLOUDFLARE_SETUP !== 'true') {
  try {
    // We import at runtime to avoid TypeScript / bundler type issues with internal module
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    let maybe: any;
    try {
      maybe = require('@cloudflare/next-on-pages/next-dev');
    } catch (_err) {
      // Fallback for older versions or alternative layouts
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
      maybe = require('@cloudflare/next-on-pages/internal/next-dev');
    }
    // The package exports a helper named `setupDevPlatform` (subject to version); check safely
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setupDevPlatform: any = maybe && (maybe.setupDevPlatform || maybe.default || maybe);
    if (typeof setupDevPlatform === 'function') {
      // `setupDevPlatform` mutates runtime / monkey-patches to enable next-on-pages dev behavior
      // and does not return a modified config, so call it for side-effects and keep our config export.
      try {
        setupDevPlatform(nextConfig);
        console.log('✔ setupDevPlatform applied for local development (side-effects only)');
      } catch (err) {
        console.warn('setupDevPlatform threw an error during initialization:', (err as any)?.message || err);
      }
    }
  } catch (e) {
    // If the internal helper isn't available, it's okay — dev environment will still run but
    // some next-on-pages features (like getRequestContext) may not be present.
    // We intentionally swallow errors here to keep dev builds robust.
    // eslint-disable-next-line no-console
    console.warn('setupDevPlatform not applied (helper not found):', (e as any)?.message || e);
  }
}

export default _export;
