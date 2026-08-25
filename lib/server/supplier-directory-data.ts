/**
 * SCD-15 — Admin Supplier Portal directory (server only).
 * Per-supplier product count, inventory value, distinct order count, and last
 * activity. Same supplier scope as the portal overview (own + Demo Supplier).
 * Cached under supplierPortal:* so existing portal invalidation clears it.
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import { getSuppliersForAdminIncludingDemo } from "@/prisma/supplier";
import { buildSupplierDirectoryRows } from "@/lib/insights/portal-directory";
import type { SupplierDirectoryRow } from "@/types";

export async function getSupplierDirectoryForAdmin(
  adminUserId: string,
): Promise<SupplierDirectoryRow[]> {
  const cacheKey = cacheKeys.supplierPortal.directory(adminUserId);
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<SupplierDirectoryRow[]>(cacheKey);
  if (cached) return cached;

  const supplierEntities = await getSuppliersForAdminIncludingDemo(adminUserId);
  const supplierIds = supplierEntities.map((s) => s.id);
  const supplierUserIds = [
    ...new Set(
      supplierEntities.map((s) => s.userId).filter((id): id is string =>
        Boolean(id),
      ),
    ),
  ];

  const [users, products] = await Promise.all([
    supplierUserIds.length
      ? prisma.user.findMany({
          where: { id: { in: supplierUserIds } },
          select: { id: true, email: true, image: true },
        })
      : Promise.resolve(
          [] as { id: string; email: string; image: string | null }[],
        ),
    supplierIds.length
      ? prisma.product.findMany({
          where: mergeProductListWhere({ supplierId: { in: supplierIds } }),
          select: {
            id: true,
            supplierId: true,
            price: true,
            quantity: true,
            createdAt: true,
          },
        })
      : Promise.resolve(
          [] as {
            id: string;
            supplierId: string;
            price: number;
            quantity: number;
            createdAt: Date;
          }[],
        ),
  ]);

  const productIds = products.map((p) => p.id);
  const orderLines = productIds.length
    ? await prisma.orderItem.findMany({
        where: { productId: { in: productIds } },
        select: { productId: true, orderId: true, createdAt: true },
      })
    : [];

  const rows = buildSupplierDirectoryRows(
    supplierEntities.map((s) => ({
      id: s.id,
      userId: s.userId ?? null,
      name: s.name,
      createdAt: s.createdAt.toISOString(),
    })),
    users,
    products.map((p) => ({
      id: p.id,
      supplierId: p.supplierId,
      price: Number(p.price),
      quantity: Number(p.quantity),
      createdAt: p.createdAt.toISOString(),
    })),
    orderLines.map((l) => ({
      productId: l.productId,
      orderId: l.orderId,
      createdAt: l.createdAt.toISOString(),
    })),
  );

  await setCache(cacheKey, rows, 300, { fetchedAt: cacheReadStartedAt });
  return rows;
}
