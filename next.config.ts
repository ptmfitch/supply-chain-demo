import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import { SENTRY_TUNNEL_PATH } from "./lib/monitoring/sentry-config";
import { DEV_STATIC_ASSET_PREFIX } from "./lib/vercel/dev-static-prefix";
import { buildNextProductionHeaderRules } from "./lib/vercel/production-headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Turbopack chunk names are stable; leftover `immutable` /_next/static
  // entries from before production-headers.ts gated that rule will hydrate
  // a stale Navbar unless the public URL changes.
  assetPrefix:
    process.env.NODE_ENV === "production"
      ? undefined
      : DEV_STATIC_ASSET_PREFIX,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "robohash.org",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  poweredByHeader: false,

  experimental: {
    optimizePackageImports: ["@/components", "@/lib"],
  },

  // Security headers always; immutable /_next/static cache in production only
  // (dev: hashed-less chunks + immutable = stale client JS vs fresh SSR HTML).
  async headers() {
    return buildNextProductionHeaderRules();
  },

  async rewrites() {
    if (process.env.NODE_ENV === "production") {
      return [];
    }
    return [
      {
        source: `${DEV_STATIC_ASSET_PREFIX}/_next/:path*`,
        destination: "/_next/:path*",
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? "arnob-mahmuds-org",
  project: process.env.SENTRY_PROJECT ?? "stock-inventory",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // First-party tunnel — must match `tunnel` in instrumentation-client.ts (SENTRY_TUNNEL_PATH)
  tunnelRoute: SENTRY_TUNNEL_PATH,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
