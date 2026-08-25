import { describe, expect, it } from "vitest";
import {
  ADMIN_SETTINGS_EMAIL_HREF,
  ADMIN_SETTINGS_HREF,
  ADMIN_SETTINGS_ITEMS,
  getAdminSidebarWarmPaths,
} from "@/lib/navigation/admin-nav-config";

describe("admin-nav-config System Settings (SCD-8)", () => {
  it("lists System Config above Email Preferences", () => {
    expect(ADMIN_SETTINGS_ITEMS.map((item) => item.label)).toEqual([
      "System Config",
      "Email Preferences",
    ]);
    expect(ADMIN_SETTINGS_ITEMS[0]).toMatchObject({
      href: ADMIN_SETTINGS_HREF,
      exact: true,
    });
    expect(ADMIN_SETTINGS_ITEMS[1]?.href).toBe(ADMIN_SETTINGS_EMAIL_HREF);
  });

  it("includes both settings routes in admin sidebar warm paths", () => {
    const paths = getAdminSidebarWarmPaths();
    expect(paths).toContain(ADMIN_SETTINGS_HREF);
    expect(paths).toContain(ADMIN_SETTINGS_EMAIL_HREF);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
