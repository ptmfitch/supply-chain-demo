/**
 * SCD-15 — Admin Supplier Portal directory (server only).
 * Per-supplier product count, inventory value, distinct order count, and last
 * activity via Mongo aggregations — no full product or order-line loads.
 * Same supplier scope as the portal overview (own + Demo Supplier).
 * Cached under supplierPortal:* so existing portal invalidation clears it.
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import { getSuppliersForAdminIncludingDemo } from "@/prisma/supplier";
import {
  buildSupplierDirectoryRows,
  type SupplierOrderAggregate,
  type SupplierProductAggregate,
} from "@/lib/insights/portal-directory";
import type { SupplierDirectoryRow } from "@/types";

/** Sanity cap — directory is store-scale (hundreds), not unbounded. */
const SUPPLIER_DIRECTORY_MAX = 1000;

const notDeletedMatch = {
  $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
};

function mongoOid(id: string): { $oid: string } {
  return { $oid: id };
}

function rawIdToString(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  if (value && typeof value === "object" && "$oid" in value) {
    const oid = (value as { $oid: unknown }).$oid;
    return typeof oid === "string" && oid.length > 0 ? oid : null;
  }
  return null;
}

function rawDateToIso(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (typeof value === "object" && "$date" in value) {
    const raw = (value as { $date: unknown }).$date;
    if (typeof raw === "string" || typeof raw === "number") {
      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }
  }
  return null;
}

function rawNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.length > 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (value && typeof value === "object" && "$numberLong" in value) {
    const n = Number((value as { $numberLong: string }).$numberLong);
    return Number.isFinite(n) ? n : 0;
  }
  if (value && typeof value === "object" && "$numberDouble" in value) {
    const n = Number((value as { $numberDouble: string }).$numberDouble);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function asRawObjects(result: unknown): Record<string, unknown>[] {
  if (!Array.isArray(result)) return [];
  return result.filter(
    (row): row is Record<string, unknown> =>
      Boolean(row) && typeof row === "object" && !Array.isArray(row),
  );
}

function productSupplierMatch(supplierIds: string[]) {
  return {
    $and: [
      { supplierId: { $in: supplierIds.map(mongoOid) } },
      notDeletedMatch,
    ],
  };
}

async function aggregateProductsBySupplier(
  supplierIds: string[],
): Promise<SupplierProductAggregate[]> {
  // groupBy cannot express sum(price * quantity); $group returns one row per supplier.
  const raw = await prisma.product.aggregateRaw({
    pipeline: [
      { $match: productSupplierMatch(supplierIds) },
      {
        $group: {
          _id: "$supplierId",
          productCount: { $sum: 1 },
          inventoryValue: {
            $sum: { $multiply: ["$price", { $toDouble: "$quantity" }] },
          },
          lastProductAt: { $max: "$createdAt" },
        },
      },
      { $limit: SUPPLIER_DIRECTORY_MAX },
    ],
  });

  const out: SupplierProductAggregate[] = [];
  for (const row of asRawObjects(raw)) {
    const supplierId = rawIdToString(row._id);
    if (!supplierId) continue;
    out.push({
      supplierId,
      productCount: rawNumber(row.productCount),
      inventoryValue: rawNumber(row.inventoryValue),
      lastProductAt: rawDateToIso(row.lastProductAt),
    });
  }
  return out;
}

async function aggregateOrdersBySupplier(
  supplierIds: string[],
): Promise<SupplierOrderAggregate[]> {
  // Distinct order count per supplier: $group output is one row per supplier.
  const raw = await prisma.product.aggregateRaw({
    pipeline: [
      { $match: productSupplierMatch(supplierIds) },
      {
        $lookup: {
          from: "OrderItem",
          localField: "_id",
          foreignField: "productId",
          as: "lines",
        },
      },
      { $unwind: "$lines" },
      {
        $group: {
          _id: { supplierId: "$supplierId", orderId: "$lines.orderId" },
          lastOrderAt: { $max: "$lines.createdAt" },
        },
      },
      {
        $group: {
          _id: "$_id.supplierId",
          orderCount: { $sum: 1 },
          lastOrderAt: { $max: "$lastOrderAt" },
        },
      },
      { $limit: SUPPLIER_DIRECTORY_MAX },
    ],
  });

  const out: SupplierOrderAggregate[] = [];
  for (const row of asRawObjects(raw)) {
    const supplierId = rawIdToString(row._id);
    if (!supplierId) continue;
    out.push({
      supplierId,
      orderCount: rawNumber(row.orderCount),
      lastOrderAt: rawDateToIso(row.lastOrderAt),
    });
  }
  return out;
}

export async function getSupplierDirectoryForAdmin(
  adminUserId: string,
): Promise<SupplierDirectoryRow[]> {
  const cacheKey = cacheKeys.supplierPortal.directory(adminUserId);
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<SupplierDirectoryRow[]>(cacheKey);
  if (cached) return cached;

  const supplierEntities = (
    await getSuppliersForAdminIncludingDemo(adminUserId)
  ).slice(0, SUPPLIER_DIRECTORY_MAX);
  const supplierIds = supplierEntities.map((s) => s.id);
  const supplierUserIds = [
    ...new Set(
      supplierEntities.map((s) => s.userId).filter((id): id is string =>
        Boolean(id),
      ),
    ),
  ];

  const [users, productAggs, orderAggs] = await Promise.all([
    supplierUserIds.length
      ? prisma.user.findMany({
          where: { id: { in: supplierUserIds } },
          select: { id: true, email: true, image: true },
          take: supplierUserIds.length,
        })
      : Promise.resolve(
          [] as { id: string; email: string; image: string | null }[],
        ),
    supplierIds.length
      ? aggregateProductsBySupplier(supplierIds)
      : Promise.resolve([] as SupplierProductAggregate[]),
    supplierIds.length
      ? aggregateOrdersBySupplier(supplierIds)
      : Promise.resolve([] as SupplierOrderAggregate[]),
  ]);

  const rows = buildSupplierDirectoryRows(
    supplierEntities.map((s) => ({
      id: s.id,
      userId: s.userId ?? null,
      name: s.name,
      createdAt: s.createdAt.toISOString(),
    })),
    users,
    productAggs,
    orderAggs,
  );

  await setCache(cacheKey, rows, 300, { fetchedAt: cacheReadStartedAt });
  return rows;
}
