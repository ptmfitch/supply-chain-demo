import { describe, expect, it } from "vitest";
import {
  addRangeDays,
  buildDashboardRangeTrends,
  buildRangeBuckets,
  bucketKeyForDate,
  DASHBOARD_RANGE_MAX_DAYS,
  DASHBOARD_RANGE_ROW_LIMIT,
  formatRangeDateLabel,
  getDashboardRangeForPreset,
  getDefaultDashboardRange,
  isDashboardRangeWithinMax,
  isDefaultDashboardRange,
  rangeDayCount,
  resolveRangeGranularity,
  tryDashboardRangeChange,
} from "./dashboard-range";

const NOW = new Date(2026, 7, 25); // Aug 25, 2026 (local)

describe("getDefaultDashboardRange", () => {
  it("spans the first of the month 11 months back through today", () => {
    expect(getDefaultDashboardRange(NOW)).toEqual({
      from: "2025-09-01",
      to: "2026-08-25",
    });
  });

  it("round-trips isDefaultDashboardRange", () => {
    expect(isDefaultDashboardRange(getDefaultDashboardRange(NOW), NOW)).toBe(
      true,
    );
    expect(
      isDefaultDashboardRange({ from: "2026-08-01", to: "2026-08-25" }, NOW),
    ).toBe(false);
  });
});

describe("formatRangeDateLabel", () => {
  it("formats yyyy-mm-dd as that calendar day (no UTC midnight shift)", () => {
    expect(formatRangeDateLabel("2026-08-25")).toBe("Aug 25, 2026");
    expect(formatRangeDateLabel("2026-01-01")).toBe("Jan 1, 2026");
  });
});

describe("isDashboardRangeWithinMax", () => {
  it("allows the default and preset spans", () => {
    for (const key of ["30d", "90d", "12m", "ytd"] as const) {
      expect(
        isDashboardRangeWithinMax(getDashboardRangeForPreset(key, NOW)),
      ).toBe(true);
    }
  });

  it("rejects spans longer than DASHBOARD_RANGE_MAX_DAYS", () => {
    expect(
      isDashboardRangeWithinMax({ from: "2024-01-01", to: "2026-08-25" }),
    ).toBe(false);
    expect(DASHBOARD_RANGE_MAX_DAYS).toBe(366);
    expect(
      isDashboardRangeWithinMax({ from: "2025-08-25", to: "2026-08-25" }),
    ).toBe(true);
  });
});

describe("tryDashboardRangeChange", () => {
  const current = { from: "2025-08-25", to: "2026-08-25" };

  it("applies an in-bounds From/To patch", () => {
    expect(tryDashboardRangeChange(current, { from: "2026-01-01" })).toEqual({
      from: "2026-01-01",
      to: "2026-08-25",
    });
  });

  it("rejects a span past DASHBOARD_RANGE_MAX_DAYS", () => {
    expect(tryDashboardRangeChange(current, { from: "2024-01-01" })).toBeNull();
  });

  it("rejects from after to", () => {
    expect(tryDashboardRangeChange(current, { from: "2026-09-01" })).toBeNull();
  });
});

describe("addRangeDays", () => {
  it("shifts a calendar day without UTC midnight drift", () => {
    expect(addRangeDays("2026-08-25", -(DASHBOARD_RANGE_MAX_DAYS - 1))).toBe(
      "2025-08-25",
    );
    expect(addRangeDays("2025-08-25", DASHBOARD_RANGE_MAX_DAYS - 1)).toBe(
      "2026-08-25",
    );
  });

  it("keeps the newest-first analytics row cap at 10k", () => {
    expect(DASHBOARD_RANGE_ROW_LIMIT).toBe(10_000);
  });
});

describe("getDashboardRangeForPreset", () => {
  it("30d covers 30 inclusive days", () => {
    const r = getDashboardRangeForPreset("30d", NOW);
    expect(r).toEqual({ from: "2026-07-27", to: "2026-08-25" });
    expect(rangeDayCount(r)).toBe(30);
  });

  it("ytd starts Jan 1", () => {
    expect(getDashboardRangeForPreset("ytd", NOW)).toEqual({
      from: "2026-01-01",
      to: "2026-08-25",
    });
  });

  it("12m equals the default range", () => {
    expect(getDashboardRangeForPreset("12m", NOW)).toEqual(
      getDefaultDashboardRange(NOW),
    );
  });
});

describe("resolveRangeGranularity", () => {
  it("buckets short ranges by day, medium by week, long by month", () => {
    expect(
      resolveRangeGranularity({ from: "2026-08-01", to: "2026-08-25" }),
    ).toBe("day");
    expect(
      resolveRangeGranularity({ from: "2026-05-01", to: "2026-08-25" }),
    ).toBe("week");
    expect(
      resolveRangeGranularity({ from: "2025-09-01", to: "2026-08-25" }),
    ).toBe("month");
  });
});

describe("buildRangeBuckets", () => {
  it("builds gap-free daily buckets", () => {
    const { granularity, buckets } = buildRangeBuckets({
      from: "2026-08-23",
      to: "2026-08-25",
    });
    expect(granularity).toBe("day");
    expect(buckets.map((b) => b.key)).toEqual([
      "2026-08-23",
      "2026-08-24",
      "2026-08-25",
    ]);
    expect(buckets[0]?.label).toBe("Aug 23");
  });

  it("builds monthly buckets across a year boundary", () => {
    const { granularity, buckets } = buildRangeBuckets({
      from: "2025-08-01",
      to: "2026-02-10",
    });
    expect(granularity).toBe("month");
    expect(buckets.map((b) => b.key)).toEqual([
      "2025-08",
      "2025-09",
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
    expect(buckets[0]?.label).toBe("Aug 25");
  });

  it("weekly buckets start on Monday and cover the range end", () => {
    const { granularity, buckets } = buildRangeBuckets({
      from: "2026-05-01",
      to: "2026-08-25",
    });
    expect(granularity).toBe("week");
    // 2026-05-01 is a Friday; its week bucket starts Mon 2026-04-27
    expect(buckets[0]?.key).toBe("2026-04-27");
    const lastKey = buckets.at(-1)?.key;
    expect(lastKey).toBe(bucketKeyForDate(new Date(2026, 7, 25), "week"));
  });
});

describe("buildDashboardRangeTrends", () => {
  it("counts rows into the right buckets and excludes cancelled orders", () => {
    const { granularity, trends } = buildDashboardRangeTrends(
      { from: "2026-08-23", to: "2026-08-25" },
      {
        orders: [
          { createdAt: "2026-08-23T10:00:00.000Z", total: 100 },
          { createdAt: "2026-08-23T11:00:00.000Z", total: 50 },
          {
            createdAt: "2026-08-24T09:00:00.000Z",
            total: 999,
            status: "cancelled",
          },
        ],
        invoices: [{ createdAt: "2026-08-25T12:00:00.000Z", total: 100 }],
        products: [{ createdAt: "2026-08-24T12:00:00.000Z" }],
      },
    );
    expect(granularity).toBe("day");
    // Midday timestamps keep day-bucketing stable across test-runner timezones
    expect(trends).toHaveLength(3);
    const byKey = new Map(trends.map((t) => [t.month, t]));
    expect(byKey.get("2026-08-23")).toMatchObject({ orders: 2, revenue: 150 });
    expect(byKey.get("2026-08-24")).toMatchObject({
      orders: 0,
      revenue: 0,
      products: 1,
    });
    expect(byKey.get("2026-08-25")).toMatchObject({ invoices: 1 });
  });

  it("ignores rows outside the range", () => {
    const { trends } = buildDashboardRangeTrends(
      { from: "2026-08-23", to: "2026-08-24" },
      {
        orders: [{ createdAt: "2026-08-20T10:00:00.000Z", total: 100 }],
        invoices: [],
        products: [],
      },
    );
    expect(trends.every((t) => t.orders === 0 && t.revenue === 0)).toBe(true);
  });
});
