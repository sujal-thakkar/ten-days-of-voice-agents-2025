import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    /* Allow importing shared assets from the monorepo root */
    externalDir: true,
  },
};

export default nextConfig;
