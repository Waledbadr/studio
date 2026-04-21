import type {NextConfig} from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import path from 'path';

const RENDER_GIT_BRANCH = process.env.RENDER_GIT_BRANCH;
const RENDER_GIT_COMMIT = process.env.RENDER_GIT_COMMIT;
const BUILD_TIME_ISO = new Date().toISOString();
const BASE_PATH = '/timesheet';

if (process.env.NODE_ENV !== 'production') {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  transpilePackages: ['@estatecare/ui'],
  /* config options here */
  serverExternalPackages: [
    'firebase-admin',
    'firebase',
    'genkit',
    '@genkit-ai/googleai',
    '@genkit-ai/next',
    'xlsx',
    '@simplewebauthn/server',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  productionBrowserSourceMaps: false,
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@estatecare/ui': path.resolve(__dirname, '../../packages/ui/src/components/ui'),
      '@estatecare/ui/lib': path.resolve(__dirname, '../../packages/ui/src/lib'),
    };

    if (process.env.NEXT_PUBLIC_DISABLE_FIREBASE === 'true') {
      config.resolve.alias = {
        ...config.resolve.alias,
        'firebase/app': false,
        'firebase/firestore': false,
        'firebase/storage': false,
        'firebase/auth': false,
        'firebase/app-check': false,
        'firebase-admin': false,
        'firebase': false,
      };
    }
    return config;
  },
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
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH ?? BASE_PATH,
  },
};

export default nextConfig;
