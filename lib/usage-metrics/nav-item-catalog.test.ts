import { describe, expect, it } from "vitest";
import {
  buildNavItemCatalog,
  buildNavItemKey,
  getDuplicateNavItems,
  getSidebarOnlyNavItems,
  slugifyNavLabel,
} from "./nav-item-catalog";
import {
  ADMIN_MANAGEMENT_ITEMS,
  ADMIN_MY_ACTIVITY_ITEMS,
  ADMIN_MY_STORE_ITEMS,
  ADMIN_SETTINGS_EMAIL_HREF,
} from "@/lib/navigation/admin-nav-config";
import {
  PROFILE_MENU_PATHS,
  getNavItemsForRole,
} from "@/lib/navigation/role-nav-config";

const catalog = buildNavItemCatalog();

describe("slugifyNavLabel", () => {
  it("slugifies multi-word and ampersand labels", () => {
    expect(slugifyNavLabel("Business Insights")).toBe("business-insights");
    expect(slugifyNavLabel("Product & System Management")).toBe(
      "product-and-system-management",
    );
    expect(slugifyNavLabel("Orders")).toBe("orders");
  });
});

describe("buildNavItemCatalog", () => {
  it("covers every rendered nav surface exactly once", () => {
    const bySource = (source: string) =>
      catalog.filter((item) => item.source === source);

    expect(bySource("top_bar")).toHaveLength(9);
    expect(bySource("sidebar")).toHaveLength(13);
    expect(bySource("profile_menu")).toHaveLength(4);
    expect(new Set(catalog.map((item) => item._id)).size).toBe(catalog.length);
  });

  it("stays in sync with the nav configs it is derived from", () => {
    const hrefsFor = (source: string) =>
      catalog.filter((item) => item.source === source).map((item) => item.href);

    expect(hrefsFor("top_bar")).toEqual(
      getNavItemsForRole("admin").map((item) => item.path),
    );
    expect(hrefsFor("sidebar")).toEqual([
      ...ADMIN_MY_STORE_ITEMS.map((item) => item.href),
      ...ADMIN_MANAGEMENT_ITEMS.map((item) => item.href),
      ...ADMIN_MY_ACTIVITY_ITEMS.map((item) => item.href),
      ADMIN_SETTINGS_EMAIL_HREF,
    ]);
    expect(hrefsFor("profile_menu")).toEqual([...PROFILE_MENU_PATHS]);
  });

  it("marks the four store/admin duplicate destinations", () => {
    expect(
      getDuplicateNavItems(catalog).map((item) => [item._id, item.duplicateOf]),
    ).toEqual([
      ["sidebar:orders", "top_bar:orders"],
      ["sidebar:invoices", "top_bar:invoices"],
      ["sidebar:products", "top_bar:products"],
      ["sidebar:warehouses", "top_bar:warehouses"],
    ]);
  });

  it("leaves sidebar-only destinations unmarked", () => {
    const sidebarOnly = getSidebarOnlyNavItems(catalog).map(
      (item) => item.label,
    );
    expect(sidebarOnly).toContain("Support Tickets");
    expect(sidebarOnly).toContain("User Management");
    expect(sidebarOnly).toContain("Client Portal");
    expect(sidebarOnly).not.toContain("Orders");
    expect(sidebarOnly).toHaveLength(9);
  });

  it("records that Admin Panel only redirects", () => {
    const adminPanel = catalog.find(
      (item) => item._id === buildNavItemKey("top_bar", "Admin Panel"),
    );
    expect(adminPanel?.href).toBe("/admin");
    expect(adminPanel?.redirectsTo).toBe("/admin/dashboard-overall-insights");
    expect(
      catalog.filter((item) => item.redirectsTo !== null),
    ).toHaveLength(1);
  });

  it("shares an entity across surfaces without labelling profile items duplicates", () => {
    const supportTickets = catalog.filter(
      (item) => item.entity === "support-tickets",
    );
    expect(supportTickets.map((item) => item.source).sort()).toEqual([
      "profile_menu",
      "sidebar",
    ]);
    expect(supportTickets.every((item) => item.duplicateOf === null)).toBe(true);
  });

  it("groups sidebar items and leaves other surfaces ungrouped", () => {
    const groups = new Set(
      catalog
        .filter((item) => item.source === "sidebar")
        .map((item) => item.group),
    );
    expect(groups).toEqual(
      new Set([
        "My Store",
        "Product & System Management",
        "Personal activity",
        "System Settings",
      ]),
    );
    expect(
      catalog
        .filter((item) => item.source !== "sidebar")
        .every((item) => item.group === null),
    ).toBe(true);
  });
});
