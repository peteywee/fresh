/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || "http://localhost:3333";

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  eslint: {
    // We run ESLint separately in CI; skip during Next build to avoid plugin detection warnings
    ignoreDuringBuilds: true,
  },
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
    return [
      { source: "/api/login", destination: `${API_URL}/api/login` },
      { source: "/api/register", destination: `${API_URL}/api/register` },
      { source: "/api/forgot-password", destination: `${API_URL}/api/forgot-password` },
      { source: "/api/reset-password", destination: `${API_URL}/api/reset-password` },
      { source: "/api/onboarding/complete", destination: `${API_URL}/api/onboarding/complete` },
    ];
  },
};

module.exports = nextConfig;
