/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['utfs.io']
  },
  env: {
    NEXT_PUBLIC_BASE_URL:
      process.env.NEXT_PUBLIC_BASE_URL || 'http://103.174.115.64:3000'
  },
  // This ensures absolute URLs are properly handled
  assetPrefix: process.env.NEXT_PUBLIC_BASE_URL || 'http://103.174.115.64:3000'
};

module.exports = nextConfig;
