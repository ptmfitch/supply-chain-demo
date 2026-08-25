import { describe, expect, it } from "vitest";
import {
  adminSidebarLinkClass,
  isAdminSidebarPathActive,
} from "@/lib/navigation/nav-link-styles";

describe("isAdminSidebarPathActive (SCD-8)", () => {
  it("highlights System Config only on the exact settings route", () => {
    expect(
      isAdminSidebarPathActive("/admin/settings", "/admin/settings", {
        exact: true,
      }),
    ).toBe(true);
    expect(
      isAdminSidebarPathActive(
        "/admin/settings/email-preferences",
        "/admin/settings",
        { exact: true },
      ),
    ).toBe(false);
  });

  it("still prefix-matches nested admin detail routes", () => {
    expect(isAdminSidebarPathActive("/admin/orders/abc", "/admin/orders")).toBe(
      true,
    );
    expect(
      isAdminSidebarPathActive(
        "/admin/settings/email-preferences",
        "/admin/settings/email-preferences",
      ),
    ).toBe(true);
  });

  it("does not treat a missing pathname as active", () => {
    expect(isAdminSidebarPathActive(null, "/admin/settings", { exact: true })).toBe(
      false,
    );
  });
});

describe("adminSidebarLinkClass (SCD-8)", () => {
  const activeToken = "bg-sky-500/15";

  it("applies the active token on /admin/settings and not on email-preferences", () => {
    expect(
      adminSidebarLinkClass("/admin/settings", "/admin/settings", {
        exact: true,
      }),
    ).toContain(activeToken);
    expect(
      adminSidebarLinkClass(
        "/admin/settings/email-preferences",
        "/admin/settings",
        { exact: true },
      ),
    ).not.toContain(activeToken);
  });
});
