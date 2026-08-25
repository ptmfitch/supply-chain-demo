import { describe, expect, it } from "vitest";
import type { AuditLog } from "@/types";
import {
  EMPTY_ACTIVITY_LOG_FILTERS,
  activityLogHasActiveFilters,
  filterActivityLogs,
  formatActivityDateRangeChip,
  listActivityLogUsers,
  parseIsoDateOnly,
} from "./activity-log-filter";
import { toActivityLogExportRows } from "./activity-log-export";

function log(partial: Partial<AuditLog> & Pick<AuditLog, "id">): AuditLog {
  return {
    userId: "user-admin",
    action: "update",
    entityType: "product",
    entityId: "prod-123456",
    createdAt: "2026-08-20T12:00:00.000Z",
    user: {
      id: "user-admin",
      name: "Test Admin",
      email: "test@admin.com",
    },
    ...partial,
  };
}

const FIXTURE: AuditLog[] = [
  log({
    id: "1",
    action: "create",
    entityType: "order",
    entityId: "ord-aaa111",
    createdAt: "2026-08-22T15:00:00.000Z",
    details: { orderNumber: "ORD-DEMO-001" },
  }),
  log({
    id: "2",
    action: "update",
    entityType: "warehouse",
    entityId: "wh-stock1",
    createdAt: "2026-08-21T10:00:00.000Z",
    details: { name: "Main", fieldsUpdated: ["quantity"] },
  }),
  log({
    id: "3",
    action: "delete",
    entityType: "invoice",
    entityId: "inv-zzz999",
    userId: "user-client",
    createdAt: "2026-08-18T08:00:00.000Z",
    user: {
      id: "user-client",
      name: "Test Client",
      email: "test@client.com",
    },
  }),
];

describe("parseIsoDateOnly", () => {
  it("parses a local calendar day", () => {
    const date = parseIsoDateOnly("2026-08-21");
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(7);
    expect(date?.getDate()).toBe(21);
  });

  it("rejects invalid dates", () => {
    expect(parseIsoDateOnly("2026-13-01")).toBeNull();
    expect(parseIsoDateOnly("not-a-date")).toBeNull();
  });
});

describe("filterActivityLogs", () => {
  it("returns the full window when filters are empty", () => {
    expect(filterActivityLogs(FIXTURE, EMPTY_ACTIVITY_LOG_FILTERS)).toHaveLength(
      3,
    );
  });

  it("filters by action (OR within the group)", () => {
    const rows = filterActivityLogs(FIXTURE, {
      ...EMPTY_ACTIVITY_LOG_FILTERS,
      actions: ["create", "delete"],
    });
    expect(rows.map((r) => r.id)).toEqual(["1", "3"]);
  });

  it("filters by entity type", () => {
    const rows = filterActivityLogs(FIXTURE, {
      ...EMPTY_ACTIVITY_LOG_FILTERS,
      entityTypes: ["warehouse"],
    });
    expect(rows.map((r) => r.id)).toEqual(["2"]);
  });

  it("filters by user", () => {
    const rows = filterActivityLogs(FIXTURE, {
      ...EMPTY_ACTIVITY_LOG_FILTERS,
      userId: "user-client",
    });
    expect(rows.map((r) => r.id)).toEqual(["3"]);
  });

  it("filters by inclusive From–To range", () => {
    const rows = filterActivityLogs(FIXTURE, {
      ...EMPTY_ACTIVITY_LOG_FILTERS,
      startDate: "2026-08-21",
      endDate: "2026-08-22",
    });
    expect(rows.map((r) => r.id)).toEqual(["1", "2"]);
  });

  it("combines filters with AND and matches detail text search", () => {
    const rows = filterActivityLogs(FIXTURE, {
      ...EMPTY_ACTIVITY_LOG_FILTERS,
      actions: ["create", "update"],
      entityTypes: ["order", "warehouse"],
      searchTerm: "ORD-DEMO",
    });
    expect(rows.map((r) => r.id)).toEqual(["1"]);
  });

  it("returns an empty set when nothing matches", () => {
    expect(
      filterActivityLogs(FIXTURE, {
        ...EMPTY_ACTIVITY_LOG_FILTERS,
        actions: ["ship"],
      }),
    ).toEqual([]);
  });
});

describe("activityLogHasActiveFilters", () => {
  it("is false for the empty filter bag", () => {
    expect(activityLogHasActiveFilters(EMPTY_ACTIVITY_LOG_FILTERS)).toBe(false);
  });

  it("is true when any filter is set", () => {
    expect(
      activityLogHasActiveFilters({
        ...EMPTY_ACTIVITY_LOG_FILTERS,
        searchTerm: "stock",
      }),
    ).toBe(true);
  });
});

describe("listActivityLogUsers", () => {
  it("returns unique actors sorted by name", () => {
    const users = listActivityLogUsers(FIXTURE);
    expect(users.map((u) => u.id)).toEqual(["user-admin", "user-client"]);
    expect(users[0]?.email).toBe("test@admin.com");
  });
});

describe("formatActivityDateRangeChip", () => {
  it("formats a closed range", () => {
    expect(formatActivityDateRangeChip("2026-08-01", "2026-08-07")).toBe(
      "Aug 1, 2026 → Aug 7, 2026",
    );
  });
});

describe("toActivityLogExportRows", () => {
  it("maps filtered rows with stable timestamps", () => {
    const rows = toActivityLogExportRows([FIXTURE[0]!]);
    expect(rows[0]?.Action).toBe("create");
    expect(rows[0]?.Entity).toBe("order");
    expect(rows[0]?.When).toMatch(/Aug 22, 2026/);
    expect(rows[0]?.Details).toContain("ORD-DEMO-001");
  });
});
