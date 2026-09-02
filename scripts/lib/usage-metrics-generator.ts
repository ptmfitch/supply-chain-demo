/**
 * Deterministic generator for admin navigation click history.
 *
 * Shape is taken from the Q3 2026 operations-admin interview (Confluence:
 * "Interview — Operations admin, regional distributor (2026-08)"), which found:
 *  - Theme 1: two navigation systems on every admin page; the top bar wins on
 *    habit, so it takes the large majority of clicks.
 *  - Theme 2: Orders, Invoices, Products and Warehouses sit at both a store
 *    route and an admin route, so the sidebar's copies of them are nearly
 *    unused while sidebar-only destinations still get real traffic.
 *
 * Sessions pick a navigation system and mostly stay in it, which is both how
 * people behave and what makes "used both in one session" measurable.
 * Same seed in, same events out.
 */

import type { NavItemDoc } from "@/lib/usage-metrics/nav-item-catalog";
import type { NavClickEvent } from "./usage-metrics-db";

export type GeneratorOptions = {
  navItems: NavItemDoc[];
  adminUserIds: string[];
  /** Number of days to generate, ending on `endDay` inclusive. */
  days: number;
  /** Last day of the window (UTC midnight). */
  endDay: Date;
  seed: number;
};

export type GeneratorStats = {
  events: number;
  sessions: number;
  firstDay: string;
  lastDay: string;
};

const HOME_PATH = "/";

/** Relative traffic per weekday (0 = Sunday). Admin work is a weekday job. */
const WEEKDAY_ACTIVITY = [0.06, 1, 1.05, 1, 1.05, 0.9, 0.25] as const;

/** Working hours, weighted, with the lunch dip an office day actually has. */
const HOUR_WEIGHTS: ReadonlyArray<readonly [number, number]> = [
  [8, 6],
  [9, 14],
  [10, 15],
  [11, 13],
  [12, 5],
  [13, 8],
  [14, 14],
  [15, 13],
  [16, 10],
  [17, 6],
] as const;

/** Share of clicks that go to the profile dropdown, in any session mode. */
const PROFILE_MENU_CLICK_SHARE = 0.04;

/** Sidebar clicks inside a sidebar-led session that land on a duplicate entry. */
const DUPLICATE_PICK_SHARE = 0.13;

/** Sessions that use both systems and reach one entity through both. */
const CROSS_NAV_SHARE = 0.35;

/** Sidebar share of nav clicks inside a session that uses both systems. */
const SIDEBAR_SHARE_IN_MIXED_SESSION = 0.3;

/**
 * Session mode mix, drifting across the window: habit hardens, so top-bar-only
 * sessions grow while sidebar-led and mixed sessions shrink.
 */
const SESSION_MODE_DRIFT = {
  sidebarOnly: { start: 0.155, end: 0.095 },
  both: { start: 0.23, end: 0.19 },
} as const;

const TOP_BAR_WEIGHTS: Record<string, number> = {
  Orders: 26,
  Invoices: 20,
  Products: 16,
  Dashboard: 12,
  Warehouses: 9,
  Suppliers: 6,
  Categories: 4,
  "Business Insights": 4,
  "Admin Panel": 3,
};

const SIDEBAR_ONLY_WEIGHTS: Record<string, number> = {
  "Support Tickets": 24,
  "Store Overview": 20,
  "User Management": 14,
  "Client Portal": 12,
  "Product Reviews": 11,
  "Supplier Portal": 9,
  "Activity History": 6,
  "My Activity": 3,
  "Email Preferences": 1,
};

const SIDEBAR_DUPLICATE_WEIGHTS: Record<string, number> = {
  Orders: 40,
  Invoices: 25,
  Products: 25,
  Warehouses: 10,
};

const PROFILE_MENU_WEIGHTS: Record<string, number> = {
  "Support Tickets": 45,
  "Email Preferences": 20,
  "API Status": 20,
  "API Documentation": 15,
};

/** mulberry32 — small, fast, and reproducible from a 32-bit seed. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type WeightedPicker<T> = (random: () => number) => T;

function createWeightedPicker<T>(entries: Array<[T, number]>): WeightedPicker<T> {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (entries.length === 0 || total <= 0) {
    throw new Error("createWeightedPicker needs at least one positive weight");
  }

  return (random) => {
    let threshold = random() * total;
    for (const [value, weight] of entries) {
      threshold -= weight;
      if (threshold <= 0) return value;
    }
    // Only reachable through floating point drift on the final entry.
    return entries[entries.length - 1]![0];
  };
}

function weightedByLabel(
  items: NavItemDoc[],
  weights: Record<string, number>,
): Array<[NavItemDoc, number]> {
  const missing = items.filter((item) => weights[item.label] === undefined);
  if (missing.length > 0) {
    throw new Error(
      `No click weight for nav item(s): ${missing
        .map((item) => item._id)
        .join(", ")}. Add them to the weight tables.`,
    );
  }
  return items.map((item) => [item, weights[item.label]!]);
}

function randomInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(day: Date, offset: number): Date {
  return new Date(day.getTime() + offset * 86_400_000);
}

type SessionMode = "top_bar_only" | "sidebar_only" | "both";

/**
 * Generate one navigation click event at a time, oldest first.
 * Yielding keeps memory flat so the caller can insert in batches.
 */
export function* generateNavClickEvents(
  options: GeneratorOptions,
): Generator<NavClickEvent, GeneratorStats> {
  const { navItems, adminUserIds, days, endDay, seed } = options;
  if (adminUserIds.length === 0) {
    throw new Error("generateNavClickEvents needs at least one admin user id");
  }

  const random = createRandom(seed);

  const topBarItems = navItems.filter((item) => item.source === "top_bar");
  const sidebarDuplicates = navItems.filter(
    (item) => item.source === "sidebar" && item.duplicateOf !== null,
  );
  const sidebarOnly = navItems.filter(
    (item) => item.source === "sidebar" && item.duplicateOf === null,
  );
  const profileItems = navItems.filter(
    (item) => item.source === "profile_menu",
  );

  const pickTopBar = createWeightedPicker(
    weightedByLabel(topBarItems, TOP_BAR_WEIGHTS),
  );
  const pickSidebarOnly = createWeightedPicker(
    weightedByLabel(sidebarOnly, SIDEBAR_ONLY_WEIGHTS),
  );
  const pickSidebarDuplicate = createWeightedPicker(
    weightedByLabel(sidebarDuplicates, SIDEBAR_DUPLICATE_WEIGHTS),
  );
  const pickProfile = createWeightedPicker(
    weightedByLabel(profileItems, PROFILE_MENU_WEIGHTS),
  );
  const pickHour = createWeightedPicker(
    HOUR_WEIGHTS.map(([hour, weight]) => [hour, weight] as [number, number]),
  );

  const topBarByEntity = new Map(
    topBarItems.map((item) => [item.entity, item]),
  );

  let events = 0;
  let sessions = 0;
  const startDay = addDays(endDay, -(days - 1));

  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const day = addDays(startDay, dayIndex);
    const progress = days > 1 ? dayIndex / (days - 1) : 1;
    const activity = WEEKDAY_ACTIVITY[day.getUTCDay()] ?? 1;

    const sidebarOnlyProbability = lerp(
      SESSION_MODE_DRIFT.sidebarOnly.start,
      SESSION_MODE_DRIFT.sidebarOnly.end,
      progress,
    );
    const bothProbability = lerp(
      SESSION_MODE_DRIFT.both.start,
      SESSION_MODE_DRIFT.both.end,
      progress,
    );

    for (const [adminIndex, userId] of adminUserIds.entries()) {
      const plannedSessions = randomInt(random, 2, 5) * activity;
      // Fractional remainder becomes a probability, so quiet days stay sparse
      // instead of rounding every admin up to one session.
      const sessionCount =
        Math.floor(plannedSessions) +
        (random() < plannedSessions % 1 ? 1 : 0);

      for (let sessionIndex = 0; sessionIndex < sessionCount; sessionIndex += 1) {
        sessions += 1;
        const sessionId = `s${seed}-${toDayKey(day)}-${adminIndex}-${sessionIndex}`;

        const modeRoll = random();
        const mode: SessionMode =
          modeRoll < sidebarOnlyProbability
            ? "sidebar_only"
            : modeRoll < sidebarOnlyProbability + bothProbability
              ? "both"
              : "top_bar_only";

        const clickCount = randomInt(random, 4, 12);

        // A mixed session either deliberately reaches one entity through both
        // systems (Theme 2) or keeps the sidebar for sidebar-only pages.
        const crossNavItem =
          mode === "both" && random() < CROSS_NAV_SHARE
            ? pickSidebarDuplicate(random)
            : null;
        const crossNavClickIndex =
          crossNavItem === null ? -1 : randomInt(random, 1, clickCount - 1);
        let crossNavTopBarDone = false;

        let timestamp = new Date(
          day.getTime() +
            pickHour(random) * 3_600_000 +
            randomInt(random, 0, 59) * 60_000 +
            randomInt(random, 0, 59) * 1000,
        );
        let currentPath = HOME_PATH;

        for (let clickIndex = 0; clickIndex < clickCount; clickIndex += 1) {
          let item: NavItemDoc;

          if (crossNavItem !== null && clickIndex === crossNavClickIndex) {
            item = crossNavItem;
          } else if (
            crossNavItem !== null &&
            !crossNavTopBarDone &&
            clickIndex === crossNavClickIndex - 1
          ) {
            // Reach the same destination from the top bar first, which is the
            // order the interview describes: habit first, sidebar second.
            item = topBarByEntity.get(crossNavItem.entity) ?? pickTopBar(random);
            crossNavTopBarDone = true;
          } else if (random() < PROFILE_MENU_CLICK_SHARE) {
            item = pickProfile(random);
          } else if (mode === "top_bar_only") {
            item = pickTopBar(random);
          } else if (mode === "sidebar_only") {
            item =
              random() < DUPLICATE_PICK_SHARE
                ? pickSidebarDuplicate(random)
                : pickSidebarOnly(random);
          } else {
            item =
              random() < SIDEBAR_SHARE_IN_MIXED_SESSION
                ? pickSidebarOnly(random)
                : pickTopBar(random);
          }

          yield {
            ts: timestamp,
            meta: {
              source: item.source,
              itemKey: item._id,
              userId,
            },
            sessionId,
            href: item.href,
            fromPath: currentPath,
            entity: item.entity,
            isDuplicateDestination: item.duplicateOf !== null,
            isRedirectDestination: item.redirectsTo !== null,
          };
          events += 1;

          currentPath = item.redirectsTo ?? item.href;
          timestamp = new Date(
            timestamp.getTime() + randomInt(random, 20, 180) * 1000,
          );
        }
      }
    }
  }

  return {
    events,
    sessions,
    firstDay: toDayKey(startDay),
    lastDay: toDayKey(endDay),
  };
}
