import { describe, expect, it } from "vitest";
import {
  NEXT_STATIC_CACHE_CONTROL,
  buildNextProductionHeaderRules,
} from "./production-headers";

describe("buildNextProductionHeaderRules", () => {
  it("omits /_next/static Cache-Control when includeStaticAssetCache is false (dev)", () => {
    const rules = buildNextProductionHeaderRules({
      includeStaticAssetCache: false,
    });
    expect(rules.map((r) => r.source)).toEqual(["/(.*)"]);
  });

  it("sets immutable Cache-Control on /_next/static in production", () => {
    const rules = buildNextProductionHeaderRules({
      includeStaticAssetCache: true,
    });
    expect(rules).toContainEqual({
      source: "/_next/static/(.*)",
      headers: [{ key: "Cache-Control", value: NEXT_STATIC_CACHE_CONTROL }],
    });
  });
});
