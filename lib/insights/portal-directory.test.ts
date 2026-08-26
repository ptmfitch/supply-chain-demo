import { describe, expect, it } from "vitest";
import {
  buildClientDirectoryRows,
  buildSupplierDirectoryRows,
  directoryActivityMatches,
  filterDirectoryRows,
} from "./portal-directory";

const NOW = new Date("2026-08-25T12:00:00.000Z");

describe("directoryActivityMatches", () => {
  const daysAgo = (n: number) =>
    new Date(NOW.getTime() - n * 86_400_000).toISOString();

  it("matches everything on all", () => {
    expect(directoryActivityMatches(null, "all", NOW)).toBe(true);
    expect(directoryActivityMatches(daysAgo(400), "all", NOW)).toBe(true);
  });

  it("active30 requires activity within 30 days", () => {
    expect(directoryActivityMatches(daysAgo(10), "active30", NOW)).toBe(true);
    expect(directoryActivityMatches(daysAgo(31), "active30", NOW)).toBe(false);
    expect(directoryActivityMatches(null, "active30", NOW)).toBe(false);
  });

  it("active90 requires activity within 90 days", () => {
    expect(directoryActivityMatches(daysAgo(60), "active90", NOW)).toBe(true);
    expect(directoryActivityMatches(daysAgo(91), "active90", NOW)).toBe(false);
  });

  it("dormant means no activity in 90 days, including never", () => {
    expect(directoryActivityMatches(daysAgo(91), "dormant", NOW)).toBe(true);
    expect(directoryActivityMatches(null, "dormant", NOW)).toBe(true);
    expect(directoryActivityMatches(daysAgo(60), "dormant", NOW)).toBe(false);
  });
});

describe("filterDirectoryRows", () => {
  const rows = [
    {
      name: "Alice",
      email: "alice@x.com",
      lastActivityAt: "2026-08-20T00:00:00.000Z",
    },
    { name: "Bob", email: "bob@x.com", lastActivityAt: null },
  ];

  it("combines search and activity with AND semantics", () => {
    expect(filterDirectoryRows(rows, "alice", "all", NOW)).toHaveLength(1);
    expect(filterDirectoryRows(rows, "alice", "dormant", NOW)).toHaveLength(0);
    expect(filterDirectoryRows(rows, "", "dormant", NOW)).toEqual([rows[1]]);
  });

  it("matches on email too", () => {
    expect(filterDirectoryRows(rows, "bob@x", "all", NOW)).toEqual([rows[1]]);
  });
});

describe("buildClientDirectoryRows", () => {
  it("merges order and invoice aggregates with zero defaults", () => {
    const rows = buildClientDirectoryRows(
      [
        {
          id: "c1",
          name: "Client One",
          email: "one@x.com",
          image: null,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "c2",
          name: "Client Two",
          email: "two@x.com",
          image: null,
          createdAt: "2026-02-01T00:00:00.000Z",
        },
      ],
      [
        {
          clientId: "c1",
          orderCount: 3,
          revenueExclCancelled: 450,
          lastOrderAt: "2026-08-01T00:00:00.000Z",
        },
      ],
      [
        {
          clientId: "c1",
          invoiceCount: 2,
          lastInvoiceAt: "2026-08-10T00:00:00.000Z",
        },
      ],
    );
    expect(rows[0]).toMatchObject({
      userId: "c1",
      orderCount: 3,
      invoiceCount: 2,
      totalRevenue: 450,
      lastActivityAt: "2026-08-10T00:00:00.000Z", // invoice newer than order
    });
    expect(rows[1]).toMatchObject({
      userId: "c2",
      orderCount: 0,
      invoiceCount: 0,
      totalRevenue: 0,
      lastActivityAt: null,
    });
  });
});

describe("buildSupplierDirectoryRows", () => {
  it("merges product and order aggregates with zero defaults", () => {
    const rows = buildSupplierDirectoryRows(
      [
        {
          id: "s1",
          userId: "u1",
          name: "Supplier One",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "s2",
          userId: null,
          name: "No Account",
          createdAt: "2026-01-05T00:00:00.000Z",
        },
      ],
      [{ id: "u1", email: "sup@x.com", image: null }],
      [
        {
          supplierId: "s1",
          productCount: 2,
          inventoryValue: 90,
          lastProductAt: "2026-04-01T00:00:00.000Z",
        },
      ],
      [
        {
          supplierId: "s1",
          orderCount: 2,
          lastOrderAt: "2026-08-15T00:00:00.000Z",
        },
      ],
    );
    expect(rows[0]).toMatchObject({
      supplierId: "s1",
      email: "sup@x.com",
      productCount: 2,
      inventoryValue: 90,
      orderCount: 2,
      lastActivityAt: "2026-08-15T00:00:00.000Z",
    });
    expect(rows[1]).toMatchObject({
      supplierId: "s2",
      email: null,
      productCount: 0,
      inventoryValue: 0,
      orderCount: 0,
      lastActivityAt: null,
    });
  });
});
