import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// EXPORT=1 builds a fully-static site for GitHub Pages. Server actions,
// cookies, middleware, and auth-gated pages are short-circuited at the
// source — read-only browsing works, every interactive form is a no-op.
// Vercel and local dev keep the full server-rendered build.
const isStaticExport = process.env.EXPORT === '1';

const here = dirname(fileURLToPath(import.meta.url));
const stubPath = resolve(here, 'src/lib/_export-stub/actions.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@hikaya/ui', '@hikaya/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.hikaya.sa' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    unoptimized: isStaticExport,
  },
  experimental: {
    optimizePackageImports: ['framer-motion', '@hikaya/ui'],
  },
  poweredByHeader: false,
  ...(isStaticExport
    ? {
        output: 'export',
        basePath: '/hikaya',
        trailingSlash: true,
        // Every `lib/*/actions.ts` AND `lib/*/<name>-actions.ts` (the
        // 'use server' files) gets replaced by a single no-op stub during
        // the static build. Without this, Next refuses with "Server Actions
        // are not supported with static export".
        webpack(config, { webpack }) {
          config.plugins.push(
            new webpack.NormalModuleReplacementPlugin(
              /\/lib\/(?!_export-stub)[a-z]+\/(?:[a-z-]+-)?actions(\.ts)?$/,
              stubPath,
            ),
          );
          return config;
        },
      }
    : {}),
};

export default withNextIntl(nextConfig);
