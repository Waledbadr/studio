import type {NextConfig} from 'next';

const RENDER_GIT_BRANCH = process.env.RENDER_GIT_BRANCH;
const RENDER_GIT_COMMIT = process.env.RENDER_GIT_COMMIT;
const BUILD_TIME_ISO = new Date().toISOString();

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

export default nextConfig;
