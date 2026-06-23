import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow access from local network
  experimental: {
    serverActions: {
      allowedOrigins: ["10.107.9.172:3001", "localhost:3001", "10.107.9.172:3000", "localhost:3000"],
    },
  },
};

export default nextConfig;
