/**
 * Vercel production headers — single source for next.config.ts.
 * @see docs/VERCEL_PRODUCTION_GUARDRAILS.md
 *
 * Security headers are mirrored in vercel.json (edge). Keep keys/values in sync.
 * Immutable Cache-Control for /_next/static lives ONLY here (not vercel.json) and
 * only in production. In `next dev` those chunk URLs are not content-hashed the
 * same way — `immutable` makes the browser keep a stale Navbar/client bundle
 * while SSR HTML is fresh (hydration mismatch + Next.js Cache-Control warning).
 */

export type HeaderEntry = { key: string; value: string };

/** Security headers for all routes — also copy into vercel.json `headers[0]`. */
export const VERCEL_SECURITY_HEADERS: readonly HeaderEntry[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=()" },
] as const;

/** Content-hashed build assets — long cache reduces bot/crawler origin transfer (guardrails). */
export const NEXT_STATIC_CACHE_CONTROL =
  "public, max-age=31536000, immutable" as const;

export type NextHeaderRule = {
  source: string;
  headers: HeaderEntry[];
};

export type NextHeaderRuleOptions = {
  /** Default: true when NODE_ENV is production. Never enable in `next dev`. */
  includeStaticAssetCache?: boolean;
};

/** Rules passed to Next.js `async headers()` in next.config.ts. */
export function buildNextProductionHeaderRules(
  options?: NextHeaderRuleOptions,
): NextHeaderRule[] {
  const includeStaticAssetCache =
    options?.includeStaticAssetCache ?? process.env.NODE_ENV === "production";

  const rules: NextHeaderRule[] = [
    {
      source: "/(.*)",
      headers: [...VERCEL_SECURITY_HEADERS],
    },
  ];

  if (includeStaticAssetCache) {
    rules.push({
      source: "/_next/static/(.*)",
      headers: [{ key: "Cache-Control", value: NEXT_STATIC_CACHE_CONTROL }],
    });
  }

  return rules;
}
