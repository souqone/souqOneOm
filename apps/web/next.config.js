const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ['@carone/ui', '@carone/types'],
  reactStrictMode: true,
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.56.1', '192.168.1.192'],
  outputFileTracingIncludes: {
    '/_not-found': ['./src/app/not-found.tsx'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'caroneapi-production.up.railway.app' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  async redirects() {
    return [
      // Legacy /search routes → unified /browse
      { source: '/:locale/search', destination: '/:locale/browse', permanent: true },
      { source: '/:locale/search/:path*', destination: '/:locale/browse', permanent: true },
      // Cars section: old paths → new /cars/* paths
      { source: '/:locale/motors', destination: '/:locale/cars', permanent: true },
      { source: '/:locale/browse/cars', destination: '/:locale/cars/browse', permanent: true },
      { source: '/:locale/sale/car/:id', destination: '/:locale/cars/sale/:id', permanent: true },
      { source: '/:locale/rental/car/:id', destination: '/:locale/cars/rental/:id', permanent: true },
      { source: '/:locale/add-listing/car', destination: '/:locale/cars/new', permanent: true },
      { source: '/:locale/edit-listing/car/:id', destination: '/:locale/cars/:id/edit', permanent: true },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
