import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/cache", () => ({
  getCache: vi.fn(),
  setCache: vi.fn(),
  cacheKeys: {
    supplierPortal: {
      directory: (userId: string) => `supplierPortal:directory:v1:${userId}`,
    },
  },
}));

vi.mock("@/prisma/supplier", () => ({
  getSuppliersForAdminIncludingDemo: vi.fn(),
}));

vi.mock("@/prisma/client", () => ({
  prisma: {
    user: { findMany: vi.fn() },
    product: { findMany: vi.fn(), aggregateRaw: vi.fn() },
    orderItem: { findMany: vi.fn(), aggregateRaw: vi.fn() },
  },
}));

import { getCache, setCache } from "@/lib/cache";
import { getSuppliersForAdminIncludingDemo } from "@/prisma/supplier";
import { prisma } from "@/prisma/client";
import { getSupplierDirectoryForAdmin } from "./supplier-directory-data";

describe("getSupplierDirectoryForAdmin", () => {
  beforeEach(() => {
    vi.mocked(getCache).mockReset();
    vi.mocked(setCache).mockReset();
    vi.mocked(getSuppliersForAdminIncludingDemo).mockReset();
    vi.mocked(prisma.user.findMany).mockReset();
    vi.mocked(prisma.product.findMany).mockReset();
    vi.mocked(prisma.product.aggregateRaw).mockReset();
    vi.mocked(prisma.orderItem.findMany).mockReset();
    vi.mocked(getCache).mockResolvedValue(null);
    vi.mocked(setCache).mockResolvedValue(true);
  });

  it("aggregates per supplier without loading all products or order lines", async () => {
    vi.mocked(getSuppliersForAdminIncludingDemo).mockResolvedValue([
      {
        id: "s1",
        userId: "u1",
        name: "Supplier One",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ] as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "u1", email: "sup@x.com", image: null },
    ] as never);
    vi.mocked(prisma.product.aggregateRaw)
      .mockResolvedValueOnce([
        {
          _id: "s1",
          productCount: 2,
          inventoryValue: 90,
          lastProductAt: "2026-04-01T00:00:00.000Z",
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          _id: "s1",
          orderCount: 2,
          lastOrderAt: "2026-08-15T00:00:00.000Z",
        },
      ] as never);

    const rows = await getSupplierDirectoryForAdmin("admin-1");

    expect(prisma.product.findMany).not.toHaveBeenCalled();
    expect(prisma.orderItem.findMany).not.toHaveBeenCalled();
    expect(prisma.product.aggregateRaw).toHaveBeenCalledTimes(2);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 1 }),
    );
    expect(rows).toEqual([
      {
        supplierId: "s1",
        userId: "u1",
        name: "Supplier One",
        email: "sup@x.com",
        image: null,
        joinedAt: "2026-01-01T00:00:00.000Z",
        productCount: 2,
        inventoryValue: 90,
        orderCount: 2,
        lastActivityAt: "2026-08-15T00:00:00.000Z",
      },
    ]);
  });
});
