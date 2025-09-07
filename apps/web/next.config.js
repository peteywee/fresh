/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || "http://localhost:3333";

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

module.exports = nextConfig;
