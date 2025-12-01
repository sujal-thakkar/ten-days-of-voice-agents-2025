import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.g2crowd.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.gstatic.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
