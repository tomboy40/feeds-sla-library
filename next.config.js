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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'pg-native': false,
        'pg': false
      };
    }
    return config;
  },
};

module.exports = nextConfig;