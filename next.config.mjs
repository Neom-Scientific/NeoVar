import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url)); // Define __dirname for ES modules

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Export static files
  output: 'standalone', // Export static files
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


// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   experimental: {
//     appDir: true,
//     serverActions: false,
//   },
//   images: {
//     unoptimized: true,
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'images.unsplash.com',
//         port: '',
//         pathname: '/**',
//       },
//     ],
//   },
//   async rewrites() {
//     return [
//       {
//         source: '/api/auth/NeoFastq.py',
//         destination: '/src/app/api/auth/NeoFastq.py',
//       },
//     ];
//   },
// };

// export default nextConfig;
