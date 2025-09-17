/** @type {import('next').NextConfig} */
// Prefer API_BASE_URL, fallback to API_URL, then default to local dev port 3333
const API_URL = process.env.API_BASE_URL || process.env.API_URL || 'http://localhost:3333';

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
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['firebase', '@firebase/auth'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'fonts.gstatic.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        // Default app pages
        source: '/((?!api|_next|_static|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            // Compatible with Firebase/Google sign-in + dev/prod API calls
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.gstatic.com https://www.google.com; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "img-src 'self' data: blob:; " +
              "font-src 'self' https://fonts.gstatic.com data:; " +
              "connect-src 'self' https: http:; " + // allows API_URL in both http(s)
              "frame-src 'self' https://accounts.google.com https://www.google.com;",
          },
        ],
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
  // Configure allowed dev origins for Turbopack
  allowedDevOrigins: ['localhost:3000', '127.0.0.1:3000', '10.0.0.117:3000'],
};

module.exports = withBundleAnalyzer(nextConfig);
