import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages need to be transpiled by Next when consumed as source.
  transpilePackages: ['@hikaya/ui', '@hikaya/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.hikaya.sa' },
      // Used by mock data only — remove once @hikaya/api serves real assets.
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', '@hikaya/ui'],
  },
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
