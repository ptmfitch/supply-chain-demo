/**
 * SCD-15 — Admin Client Portal directory (server only).
 * Per-client order/invoice counts, revenue (excl. cancelled), and last
 * activity via Prisma groupBy aggregations — no full order/invoice loads.
 * Cached under clientPortal:* so existing portal invalidation clears it.
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import {
  buildClientDirectoryRows,
  type ClientOrderAggregate,
  type ClientInvoiceAggregate,
} from "@/lib/insights/portal-directory";
import type { ClientDirectoryRow } from "@/types";

/** Sanity cap — directory is store-scale (hundreds), not unbounded. */
const CLIENT_DIRECTORY_MAX_USERS = 1000;

export async function getClientDirectoryForAdmin(): Promise<
  ClientDirectoryRow[]
> {
  const cacheKey = cacheKeys.clientPortal.directory;
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<ClientDirectoryRow[]>(cacheKey);
  if (cached) return cached;

  const clientUsers = await prisma.user.findMany({
    where: { role: "client" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: CLIENT_DIRECTORY_MAX_USERS,
  });
  const clientIds = clientUsers.map((u) => u.id);

  const [orderGroups, orderRevenueGroups, invoiceGroups] = clientIds.length
    ? await Promise.all([
        prisma.order.groupBy({
          by: ["clientId"],
          where: { clientId: { in: clientIds } },
          _count: { id: true },
          _max: { createdAt: true },
        }),
        prisma.order.groupBy({
          by: ["clientId"],
          where: { clientId: { in: clientIds }, status: { not: "cancelled" } },
          _sum: { total: true },
        }),
        prisma.invoice.groupBy({
          by: ["clientId"],
          where: { clientId: { in: clientIds } },
          _count: { id: true },
          _max: { createdAt: true },
        }),
      ])
    : [[], [], []];

  const revenueByClient = new Map(
    orderRevenueGroups.map((g) => [g.clientId, Number(g._sum.total ?? 0)]),
  );
  const orderAggs: ClientOrderAggregate[] = orderGroups
    .filter((g): g is typeof g & { clientId: string } => Boolean(g.clientId))
    .map((g) => ({
      clientId: g.clientId,
      orderCount: g._count.id,
      revenueExclCancelled: revenueByClient.get(g.clientId) ?? 0,
      lastOrderAt: g._max.createdAt?.toISOString() ?? null,
    }));
  const invoiceAggs: ClientInvoiceAggregate[] = invoiceGroups
    .filter((g): g is typeof g & { clientId: string } => Boolean(g.clientId))
    .map((g) => ({
      clientId: g.clientId,
      invoiceCount: g._count.id,
      lastInvoiceAt: g._max.createdAt?.toISOString() ?? null,
    }));

  const rows = buildClientDirectoryRows(
    clientUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      createdAt: u.createdAt.toISOString(),
    })),
    orderAggs,
    invoiceAggs,
  );

  await setCache(cacheKey, rows, 300, { fetchedAt: cacheReadStartedAt });
  return rows;
}
