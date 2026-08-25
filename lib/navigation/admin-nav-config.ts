/**
 * Admin sidebar nav config (REQ-0094).
 * Single source for AdminSidebar hrefs and RouteWarmPrefetch admin RSC warm.
 */

import type { AdminCounts } from "@/types";

export type AdminNavItemConfig = {
  href: string;
  label: string;
  /** Key in admin counts for badge (optional) */
  countKey?: keyof Pick<
    AdminCounts,
    | "clientOrders"
    | "clientInvoices"
    | "supportTickets"
    | "productReviews"
    | "products"
    | "warehouses"
    | "suppliers"
    | "clients"
    | "users"
  >;
  /**
   * Match pathname exactly. Required when `href` is a prefix of another
   * sidebar item (e.g. `/admin/settings` vs `/admin/settings/email-preferences`).
   */
  exact?: boolean;
};

export const ADMIN_MY_STORE_ITEMS: AdminNavItemConfig[] = [
  {
    href: "/admin/dashboard-overall-insights",
    label: "Store Overview",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    countKey: "clientOrders",
  },
  {
    href: "/admin/invoices",
    label: "Invoices",
    countKey: "clientInvoices",
  },
  {
    href: "/admin/support-tickets",
    label: "Support Tickets",
    countKey: "supportTickets",
  },
  {
    href: "/admin/product-reviews",
    label: "Product Reviews",
    countKey: "productReviews",
  },
];

export const ADMIN_MANAGEMENT_ITEMS: AdminNavItemConfig[] = [
  {
    href: "/admin/products",
    label: "Products",
    countKey: "products",
  },
  {
    href: "/admin/warehouses",
    label: "Warehouses",
    countKey: "warehouses",
  },
  {
    href: "/admin/supplier-portal",
    label: "Supplier Portal",
    countKey: "suppliers",
  },
  {
    href: "/admin/client-portal",
    label: "Client Portal",
    countKey: "clients",
  },
  {
    href: "/admin/user-management",
    label: "User Management",
    countKey: "users",
  },
  {
    href: "/admin/activity-history",
    label: "Activity History",
  },
];

export const ADMIN_MY_ACTIVITY_ITEMS: AdminNavItemConfig[] = [
  {
    href: "/admin/my-activity",
    label: "My Activity",
  },
];

export const ADMIN_SETTINGS_HREF = "/admin/settings";
export const ADMIN_SETTINGS_EMAIL_HREF = "/admin/settings/email-preferences";

export const ADMIN_SETTINGS_ITEMS: AdminNavItemConfig[] = [
  {
    href: ADMIN_SETTINGS_HREF,
    label: "System Config",
    exact: true,
  },
  {
    href: ADMIN_SETTINGS_EMAIL_HREF,
    label: "Email Preferences",
  },
];

/** Flat deduped admin sidebar paths for idle RSC warm (admin/user roles). */
export function getAdminSidebarWarmPaths(): string[] {
  const paths = [
    ...ADMIN_MY_STORE_ITEMS.map((item) => item.href),
    ...ADMIN_MANAGEMENT_ITEMS.map((item) => item.href),
    ...ADMIN_MY_ACTIVITY_ITEMS.map((item) => item.href),
    ...ADMIN_SETTINGS_ITEMS.map((item) => item.href),
  ];
  return [...new Set(paths)];
}
