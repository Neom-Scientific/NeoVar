import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url)); // Define __dirname for ES modules

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Export static files
  outputFileTracingRoot: __dirname, // Ensure this points to the project root
  experimental: {
    outputFileTracingIncludes: {
      '/': ['./src/app/globals.css'], // Ensure globals.css is included
    },
  },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@components': path.resolve(__dirname, 'components'),
    };
    return config;
  },

  images: {
    unoptimized: true, // Required for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
