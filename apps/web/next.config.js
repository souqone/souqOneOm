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
    ];
  },
};

module.exports = withNextIntl(nextConfig);
