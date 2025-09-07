/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || "http://localhost:3333";

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  // Add headers for static assets to improve PWA caching
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

module.exports = nextConfig;
