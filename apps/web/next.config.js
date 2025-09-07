/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../../')
  }
};
module.exports = nextConfig;
