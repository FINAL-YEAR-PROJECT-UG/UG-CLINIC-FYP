import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3001"],
    },
    optimizePackageImports: ["lucide-react"],
  },
  reactStrictMode: false,
  poweredByHeader: false,
  devIndicators: {
    position: "bottom-right",
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Limit parallelism so compilation doesn't eat all CPU cores
      config.parallelism = 2;

      // Reduce watcher polling overhead on Windows
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };

      // Use cheaper source maps in dev (faster rebuilds)
      if (!isServer) {
        config.devtool = "eval-cheap-module-source-map";
      }
    }
    return config;
  },
};

export default nextConfig;
