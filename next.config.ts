import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  // simli-client 3.x re-exports `./Client` but ships `client.js` (case mismatch).
  turbopack: {
    resolveAlias: {
      'simli-client/dist/Client': path.join(__dirname, 'node_modules/simli-client/dist/client.js'),
      'simli-client/dist/Client.js': path.join(__dirname, 'node_modules/simli-client/dist/client.js'),
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'simli-client/dist/Client': path.join(__dirname, 'node_modules/simli-client/dist/client.js'),
      'simli-client/dist/Client.js': path.join(__dirname, 'node_modules/simli-client/dist/client.js'),
    }
    return config
  },
};

export default nextConfig;
