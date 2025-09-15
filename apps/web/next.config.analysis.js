const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Existing config...

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add bundle analyzer in CI or when ANALYZE=true
    if (process.env.ANALYZE === 'true' || process.env.CI) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: process.env.CI ? 'static' : 'server',
          openAnalyzer: !process.env.CI,
          reportFilename: isServer ? '../analyze/server.html' : '../analyze/client.html',
          generateStatsFile: true,
          statsFilename: isServer ? '../analyze/server-stats.json' : '../analyze/client-stats.json',
        })
      );
    }

    return config;
  },

  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@headlessui/react'],
  },

  // Bundle analysis settings
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
};

module.exports = nextConfig;
