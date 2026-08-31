import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Only use standalone tracing in production builds to avoid dev tracing overhead
  ...(process.env.NODE_ENV === "production" ? { output: "standalone" } : {}),

  // CDN Configuration for asset delivery
  // Set CDN_URL environment variable to enable CDN (e.g., https://cdn.example.com)
  assetPrefix: process.env.CDN_URL || undefined,

  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3001", "127.0.0.1:3001"],
    },
    // Tree-shake and selectively load massive icon and UI libraries for instant compilation
    optimizePackageImports: [
      "@heroicons/react",
      "@heroicons/react/24/outline",
      "@heroicons/react/24/solid",
      "lucide-react",
      "date-fns",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-avatar",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-label",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "clsx",
      "tailwind-merge",
      "sonner",
    ],
  },

  reactStrictMode: false,
  poweredByHeader: false,
  devIndicators: false,
  turbopack: {},

  // ── HTTP response headers ────────────────────────────────────────────────────
  // These cache-control directives make the browser and CDN cache static
  // assets aggressively, so repeat visits are served from disk — no round-trips.
  async headers() {
    return [
      // Next.js built static assets (_next/static) — immutable 1-year cache
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Public folder assets (images, videos, fonts, logo, etc.)
      {
        source: "/(.*)\\.(png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2|ttf|otf|mp4|webm)$",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      // API routes — no caching (always fresh)
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
      // All HTML pages — short CDN cache, always revalidate
      {
        source: "/(.*)",
        headers: [
          // Security headers
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Preconnect hints for faster font/API loading
          {
            key: "Link",
            value: [
              "<https://fonts.googleapis.com>; rel=preconnect",
              "<https://fonts.gstatic.com>; rel=preconnect; crossorigin",
            ].join(", "),
          },
        ],
      },
    ];
  },

  // Optimise images: allow SVG passthrough and set reasonable sizes
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 86400, // 24 hours browser cache for images
    // Image domains if using external CDN
    remotePatterns: process.env.CDN_URL ? [
      {
        protocol: 'https',
        hostname: new URL(process.env.CDN_URL).hostname,
        pathname: '/**',
      },
    ] : [],
  },

  webpack: (config, { dev, nextRuntime }) => {
    if (dev) {
      // ── Persistent Filesystem Cache ─────────────────────────────────────
      // IMPORTANT: We must NOT pass __filename here because Next.js compiles
      // next.config.ts → next.config.compiled.js (a temp file that may not
      // exist on disk), which causes the "Can't resolve next.config.compiled.js"
      // cache miss on every single request.
      // Instead, point at the actual source file so the path is always stable.
      //
      // Next.js runs THREE compilers: client, server, edge-server.
      // Each MUST have a unique cache name or webpack warns and collides.
      //   nextRuntime === undefined  → client bundle
      //   nextRuntime === 'nodejs'   → Node.js server bundle
      //   nextRuntime === 'edge'     → Edge runtime bundle
      const cacheName = nextRuntime === 'edge'
        ? 'edge-server'
        : nextRuntime === 'nodejs'
          ? 'server'
          : 'client';

      config.cache = {
        type: "filesystem",
        buildDependencies: {
          // Use the real .ts source path, not the compiled temp file
          config: [path.resolve(__dirname, "next.config.ts")],
        },
        name: cacheName,
        // Keep cache for 7 days
        maxAge: 604800000,
      };

      // Treat node_modules as immutable so Webpack skips scanning on every request
      config.snapshot = {
        managedPaths: [/^(.+?[\\\/]node_modules[\\\/])/],
        immutablePaths: [/^(.+?[\\\/]node_modules[\\\/])/],
      };

      // Optimize file watching — avoid polling on Windows (use native FSEvents)
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 200,
        ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**"],
      };

      // NOTE: Do NOT set config.devtool here — Next.js controls source maps
      // in dev mode and will revert any override with a performance warning.
    }

    if (!dev) {
      // ── Production: chunk splitting optimisation ──────────────────────
      // Split large vendor chunks (lucide-react, radix, etc.) into separate
      // files so the browser can cache them independently. Pages that don't
      // import heavy libs won't be blocked waiting for them to parse.
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          maxInitialRequests: 30,
          minSize: 20_000,
          cacheGroups: {
            // React core — rarely changes, long cache lifetime
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: "vendor-react",
              chunks: "all",
              priority: 40,
            },
            // Next.js internals
            nextjs: {
              test: /[\\/]node_modules[\\/](next)[\\/]/,
              name: "vendor-next",
              chunks: "all",
              priority: 35,
            },
            // Icon + UI libraries — tree-shaken but still sizeable
            ui: {
              test: /[\\/]node_modules[\\/](lucide-react|@radix-ui|class-variance-authority|clsx|tailwind-merge)[\\/]/,
              name: "vendor-ui",
              chunks: "all",
              priority: 30,
            },
            // All other node_modules
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendor-misc",
              chunks: "all",
              priority: 20,
            },
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
