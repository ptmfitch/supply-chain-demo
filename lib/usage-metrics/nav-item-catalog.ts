/**
 * Admin navigation dimension for the usage-metrics database.
 *
 * Built from the live nav configs (`role-nav-config`, `admin-nav-config`) so the
 * catalog cannot drift from what the app actually renders. Labels that only exist
 * inside client components (profile menu, sidebar group headings) are mirrored
 * here and pinned by nav-item-catalog.test.ts.
 *
 * `duplicateOf` is null for all sidebar items after the one-system nav change.
 * (profile menu vs sidebar) but at different paths, so they share an `entity`
 * without being marked duplicates — group by `entity` to find those.
 */

import {
  ADMIN_MANAGEMENT_ITEMS,
  ADMIN_MY_ACTIVITY_ITEMS,
  ADMIN_MY_STORE_ITEMS,
  ADMIN_SETTINGS_EMAIL_HREF,
  type AdminNavItemConfig,
} from "@/lib/navigation/admin-nav-config";
import {
  PROFILE_MENU_PATHS,
  getNavItemsForRole,
} from "@/lib/navigation/role-nav-config";

export type NavSource = "top_bar" | "sidebar" | "profile_menu";

export const NAV_SOURCES: readonly NavSource[] = [
  "top_bar",
  "sidebar",
  "profile_menu",
] as const;

export type NavItemDoc = {
  /** `${source}:${slug(label)}` — stable across reseeds so rollups stay joinable. */
  _id: string;
  source: NavSource;
  label: string;
  href: string;
  /** Sidebar group heading; null for top bar and profile menu. */
  group: string | null;
  /** Destination concept. Items landing on the same page share one entity. */
  entity: string;
  /** Sidebar entry whose destination is also in the top bar -> the top bar key. */
  duplicateOf: string | null;
  /** Effective destination when `href` only redirects (Admin Panel). */
  redirectsTo: string | null;
};

/** Sidebar group headings as rendered by AdminSidebar. */
const SIDEBAR_GROUPS = {
  myStore: "My Store",
  management: "Product & System Management",
  personal: "Personal activity",
  settings: "System Settings",
} as const;

/** Profile dropdown labels, keyed by the path they are attached to. */
const PROFILE_MENU_LABELS: Record<string, string> = {
  "/support-tickets": "Support Tickets",
  "/settings/email-preferences": "Email Preferences",
  "/api-docs": "API Documentation",
  "/api-status": "API Status",
};

const EMAIL_PREFERENCES_LABEL = "Email Preferences";

export function slugifyNavLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildNavItemKey(source: NavSource, label: string): string {
  return `${source}:${slugifyNavLabel(label)}`;
}

type DraftItem = Omit<NavItemDoc, "_id" | "duplicateOf"> & { _id: string };

function draft(
  source: NavSource,
  label: string,
  href: string,
  group: string | null,
  entityLabel: string = label,
  redirectsTo: string | null = null,
): DraftItem {
  return {
    _id: buildNavItemKey(source, label),
    source,
    label,
    href,
    group,
    entity: slugifyNavLabel(entityLabel),
    redirectsTo,
  };
}

function sidebarDrafts(
  items: AdminNavItemConfig[],
  group: string,
): DraftItem[] {
  return items.map((item) => draft("sidebar", item.label, item.href, group));
}

/**
 * Every admin-reachable nav item across the three surfaces.
 * Order is stable: top bar, sidebar (group order), profile menu.
 */
export function buildNavItemCatalog(): NavItemDoc[] {
  const topBar = getNavItemsForRole("admin").map((item) =>
    draft("top_bar", item.label, item.path, null, item.label),
  );

  const sidebar = [
    ...sidebarDrafts(ADMIN_MY_STORE_ITEMS, SIDEBAR_GROUPS.myStore),
    ...sidebarDrafts(ADMIN_MANAGEMENT_ITEMS, SIDEBAR_GROUPS.management),
    ...sidebarDrafts(ADMIN_MY_ACTIVITY_ITEMS, SIDEBAR_GROUPS.personal),
    draft(
      "sidebar",
      EMAIL_PREFERENCES_LABEL,
      ADMIN_SETTINGS_EMAIL_HREF,
      SIDEBAR_GROUPS.settings,
    ),
  ];

  const profileMenu = PROFILE_MENU_PATHS.map((path) =>
    draft("profile_menu", PROFILE_MENU_LABELS[path] ?? path, path, null),
  );

  const drafts = [...topBar, ...sidebar, ...profileMenu];
  const topBarKeyByEntity = new Map(
    topBar.map((item) => [item.entity, item._id]),
  );

  return drafts.map((item) => ({
    ...item,
    duplicateOf:
      item.source === "sidebar"
        ? (topBarKeyByEntity.get(item.entity) ?? null)
        : null,
  }));
}

/** Sidebar entries that duplicate a top bar destination (interview Theme 2). */
export function getDuplicateNavItems(catalog: NavItemDoc[]): NavItemDoc[] {
  return catalog.filter((item) => item.duplicateOf !== null);
}

/** Sidebar destinations with no top bar equivalent — the sidebar's only real job. */
export function getSidebarOnlyNavItems(catalog: NavItemDoc[]): NavItemDoc[] {
  return catalog.filter(
    (item) => item.source === "sidebar" && item.duplicateOf === null,
  );
}
