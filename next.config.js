/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['firebase-admin'],
  output: 'standalone',
};

module.exports = nextConfig;
