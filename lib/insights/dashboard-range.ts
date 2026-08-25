/**
 * SCD-11 — Store Overview date-range helpers (client-safe, pure).
 *
 * The dashboard's default view stays "last 12 months" and is derived from the
 * already-fetched DashboardStats (no extra fetch). Custom ranges are computed
 * server-side (lib/server/dashboard-range-data.ts) using the same bucketing
 * math exported here, so client and server can never disagree on buckets.
 */

import type {
  DashboardStats,
  DashboardRangeAnalytics,
  DashboardRangeGranularity,
  DashboardTrendPoint,
} from "@/types";

export type DashboardDateRange = {
  /** yyyy-mm-dd (inclusive, start of day) */
  from: string;
  /** yyyy-mm-dd (inclusive, end of day) */
  to: string;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Bucket by day up to ~6 weeks, by week up to ~6 months, else by month. */
const DAY_BUCKET_MAX_DAYS = 45;
const WEEK_BUCKET_MAX_DAYS = 182;

function toDateOnlyString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse yyyy-mm-dd as local start of day (avoids UTC shifting the day). */
export function parseRangeDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Inclusive end of the range day. */
export function rangeEndOfDay(value: string): Date {
  const d = parseRangeDate(value);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Default = last 12 months (first day of the month 11 months back → today). */
export function getDefaultDashboardRange(now: Date = new Date()): DashboardDateRange {
  const from = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  return { from: toDateOnlyString(from), to: toDateOnlyString(now) };
}

export function isDefaultDashboardRange(
  range: DashboardDateRange,
  now: Date = new Date(),
): boolean {
  const def = getDefaultDashboardRange(now);
  return range.from === def.from && range.to === def.to;
}

export type DashboardRangePresetKey = "30d" | "90d" | "12m" | "ytd";

export const DASHBOARD_RANGE_PRESETS: {
  key: DashboardRangePresetKey;
  label: string;
}[] = [
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "12m", label: "Last 12 months" },
  { key: "ytd", label: "Year to date" },
];

export function getDashboardRangeForPreset(
  preset: DashboardRangePresetKey,
  now: Date = new Date(),
): DashboardDateRange {
  const to = toDateOnlyString(now);
  switch (preset) {
    case "30d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return { from: toDateOnlyString(from), to };
    }
    case "90d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 89);
      return { from: toDateOnlyString(from), to };
    }
    case "12m":
      return getDefaultDashboardRange(now);
    case "ytd":
      return { from: toDateOnlyString(new Date(now.getFullYear(), 0, 1)), to };
    default: {
      const exhaustive: never = preset;
      throw new Error(`Unknown dashboard range preset: ${exhaustive}`);
    }
  }
}

export function rangeDayCount(range: DashboardDateRange): number {
  const from = parseRangeDate(range.from);
  const to = parseRangeDate(range.to);
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000) + 1;
}

export function resolveRangeGranularity(
  range: DashboardDateRange,
): DashboardRangeGranularity {
  const days = rangeDayCount(range);
  if (days <= DAY_BUCKET_MAX_DAYS) return "day";
  if (days <= WEEK_BUCKET_MAX_DAYS) return "week";
  return "month";
}

/** Monday-start week bucket for a date. */
function startOfWeek(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = out.getDay();
  const back = dow === 0 ? 6 : dow - 1;
  out.setDate(out.getDate() - back);
  return out;
}

export function bucketKeyForDate(
  date: Date,
  granularity: DashboardRangeGranularity,
): string {
  switch (granularity) {
    case "day":
      return toDateOnlyString(date);
    case "week":
      return toDateOnlyString(startOfWeek(date));
    case "month":
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    default: {
      const exhaustive: never = granularity;
      throw new Error(`Unknown granularity: ${exhaustive}`);
    }
  }
}

function bucketLabel(
  key: string,
  granularity: DashboardRangeGranularity,
  spansYears: boolean,
): string {
  if (granularity === "month") {
    const [y, m] = key.split("-").map(Number);
    return `${MONTH_LABELS[(m ?? 1) - 1]} ${String(y).slice(2)}`;
  }
  const d = parseRangeDate(key);
  const base = `${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`;
  const withYear = spansYears ? `${base} '${String(d.getFullYear()).slice(2)}` : base;
  return granularity === "week" ? `Wk ${withYear}` : withYear;
}

export type DashboardRangeBucket = { key: string; label: string };

/** Ordered, gap-free buckets covering the whole range. */
export function buildRangeBuckets(
  range: DashboardDateRange,
): { granularity: DashboardRangeGranularity; buckets: DashboardRangeBucket[] } {
  const granularity = resolveRangeGranularity(range);
  const from = parseRangeDate(range.from);
  const to = parseRangeDate(range.to);
  const spansYears = from.getFullYear() !== to.getFullYear();
  const buckets: DashboardRangeBucket[] = [];
  const seen = new Set<string>();

  const cursor = new Date(from);
  while (cursor.getTime() <= to.getTime()) {
    const key = bucketKeyForDate(cursor, granularity);
    if (!seen.has(key)) {
      seen.add(key);
      buckets.push({ key, label: bucketLabel(key, granularity, spansYears) });
    }
    if (granularity === "month") {
      cursor.setMonth(cursor.getMonth() + 1, 1);
    } else if (granularity === "week") {
      cursor.setDate(cursor.getDate() + 7);
    } else {
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  // Week cursor stepping can miss the final partial bucket; ensure `to` is covered
  const lastKey = bucketKeyForDate(to, granularity);
  if (!seen.has(lastKey)) {
    buckets.push({
      key: lastKey,
      label: bucketLabel(lastKey, granularity, spansYears),
    });
  }
  return { granularity, buckets };
}

export type RangeTrendInputs = {
  orders: { createdAt: string | Date; total: number; status?: string | null }[];
  invoices: { createdAt: string | Date; total: number }[];
  products: { createdAt: string | Date }[];
};

/**
 * Bucket raw rows into DashboardTrendPoint[]. Cancelled orders are excluded
 * from order count/revenue — same rule as the default 12-month trends.
 */
export function buildDashboardRangeTrends(
  range: DashboardDateRange,
  inputs: RangeTrendInputs,
): { granularity: DashboardRangeGranularity; trends: DashboardTrendPoint[] } {
  const { granularity, buckets } = buildRangeBuckets(range);
  const byKey = new Map(
    buckets.map((b) => [
      b.key,
      { orders: 0, revenue: 0, products: 0, invoices: 0 },
    ]),
  );

  for (const o of inputs.orders) {
    if ((o.status ?? "") === "cancelled") continue;
    const cur = byKey.get(bucketKeyForDate(new Date(o.createdAt), granularity));
    if (cur) {
      cur.orders += 1;
      cur.revenue += Number(o.total);
    }
  }
  for (const inv of inputs.invoices) {
    const cur = byKey.get(
      bucketKeyForDate(new Date(inv.createdAt), granularity),
    );
    if (cur) cur.invoices += 1;
  }
  for (const p of inputs.products) {
    const cur = byKey.get(bucketKeyForDate(new Date(p.createdAt), granularity));
    if (cur) cur.products += 1;
  }

  return {
    granularity,
    trends: buckets.map((b) => {
      const v = byKey.get(b.key)!;
      return { month: b.key, label: b.label, ...v };
    }),
  };
}

/**
 * Default range needs no fetch: the base DashboardStats already carries the
 * last-12-months trends and all-time distributions/top products.
 */
export function deriveDefaultRangeAnalyticsFromStats(
  stats: DashboardStats,
  range: DashboardDateRange,
): DashboardRangeAnalytics {
  return {
    from: range.from,
    to: range.to,
    granularity: "month",
    trends: stats.trends ?? [],
    orderStatusDistribution: stats.orderAnalytics?.statusDistribution ?? {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    },
    invoiceStatusDistribution: stats.invoiceAnalytics?.statusDistribution ?? {
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
    },
    topProducts: stats.orderAnalytics?.topProducts ?? [],
  };
}
