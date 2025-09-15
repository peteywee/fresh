/** @type {import('next').NextConfig} */
// Prefer API_BASE_URL, fallback to API_URL, then default to local dev port 3001
const API_URL = process.env.API_BASE_URL || process.env.API_URL || 'http://localhost:3001';

// Bundle analyzer setup
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  eslint: {
    // We run ESLint separately in CI; skip during Next build to avoid plugin detection warnings
    ignoreDuringBuilds: true,
  },
  // Build-time optimizations
  experimental: {
    optimizePackageImports: ['firebase', 'firebase-admin', 'zod'],
  },
  // Reduce bundle size
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error'],
          }
        : false,
  },
  // Add headers for static assets to improve PWA caching
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/manifest.webmanifest',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/api/login', destination: `${API_URL}/api/login` },
      { source: '/api/register', destination: `${API_URL}/api/register` },
      { source: '/api/forgot-password', destination: `${API_URL}/api/forgot-password` },
      { source: '/api/reset-password', destination: `${API_URL}/api/reset-password` },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
