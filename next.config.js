/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  env: {
    DLAS_API_INTERFACES_URL: process.env.DLAS_API_INTERFACES_URL,
    DLAS_API_DETAILS_URL: process.env.DLAS_API_DETAILS_URL,
  },
};

module.exports = nextConfig;