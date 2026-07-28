import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: ["10.107.9.172:3001", "localhost:3001", "10.107.9.172:3000", "localhost:3000"],
    },
    optimizePackageImports: ["lucide-react"],
  },
  reactStrictMode: false,
  poweredByHeader: false,
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
