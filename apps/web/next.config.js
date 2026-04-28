/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@barry/shared-types', '@barry/i18n'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.mapbox.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'mapbox-gl'],
  },
};

module.exports = nextConfig;
