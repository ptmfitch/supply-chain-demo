/**
 * SCD-11 — range-scoped Store Overview analytics (server only).
 *
 * Computes the date-range slice of the admin dashboard: bucketed trends,
 * order/invoice status distributions, and Top Products — same store scope as
 * getDashboardForAdmin (store orders via getStoreOrderIds, owner catalog via
 * mergeProductListWhere). Cached in Redis under dashboard:* so every existing
 * dashboard invalidation pattern clears it.
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import { getStoreOrderIds } from "@/lib/invoices/store-order-ids";
import {
  buildDashboardRangeTrends,
  parseRangeDate,
  rangeEndOfDay,
  type DashboardDateRange,
} from "@/lib/insights/dashboard-range";
import { enrichDashboardTopProducts } from "@/lib/server/dashboard-data";
import type {
  DashboardRangeAnalytics,
  DashboardOrderStatusDist,
  DashboardInvoiceStatusDist,
} from "@/types";

export async function getDashboardRangeAnalyticsForAdmin(
  userId: string,
  range: DashboardDateRange,
): Promise<DashboardRangeAnalytics> {
  const cacheKey = cacheKeys.dashboard.rangeAnalytics(
    userId,
    range.from,
    range.to,
  );
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<DashboardRangeAnalytics>(cacheKey);
  if (cached) return cached;

  const fromDate = parseRangeDate(range.from);
  const toDate = rangeEndOfDay(range.to);
  const createdInRange = { gte: fromDate, lte: toDate };

  const storeOrderIds = await getStoreOrderIds(userId);
  const whereRangeOrders = {
    id: { in: storeOrderIds },
    createdAt: createdInRange,
  };
  const whereRangeInvoices = {
    orderId: { in: storeOrderIds },
    createdAt: createdInRange,
  };

  const [ordersRaw, invoicesRaw, productsRaw, orderStatusGroups, invoiceStatusGroups] =
    await Promise.all([
      prisma.order.findMany({
        where: whereRangeOrders,
        select: { id: true, createdAt: true, total: true, status: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.invoice.findMany({
        where: whereRangeInvoices,
        select: { createdAt: true, total: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.product.findMany({
        where: mergeProductListWhere({ userId, createdAt: createdInRange }),
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: whereRangeOrders,
        _count: { id: true },
      }),
      prisma.invoice.groupBy({
        by: ["status"],
        where: whereRangeInvoices,
        _count: { id: true },
      }),
    ]);

  const rangeOrderIds = ordersRaw.map((o) => o.id);
  const topProductsRaw =
    rangeOrderIds.length > 0
      ? await prisma.orderItem.groupBy({
          by: ["productId"],
          where: { orderId: { in: rangeOrderIds } },
          _count: { id: true },
          _sum: { quantity: true, subtotal: true },
          orderBy: { _count: { id: "desc" } },
          take: 10,
        })
      : [];
  const topProducts = await enrichDashboardTopProducts(topProductsRaw);

  const { granularity, trends } = buildDashboardRangeTrends(range, {
    orders: ordersRaw.map((o) => ({
      createdAt: o.createdAt,
      total: Number(o.total),
      status: o.status,
    })),
    invoices: invoicesRaw.map((i) => ({
      createdAt: i.createdAt,
      total: Number(i.total),
    })),
    products: productsRaw,
  });

  const orderStatusDistribution: DashboardOrderStatusDist = {
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };
  for (const g of orderStatusGroups) {
    const status = g.status as keyof DashboardOrderStatusDist;
    if (status in orderStatusDistribution) {
      orderStatusDistribution[status] = g._count.id;
    }
  }

  const invoiceStatusDistribution: DashboardInvoiceStatusDist = {
    draft: 0,
    sent: 0,
    paid: 0,
    overdue: 0,
    cancelled: 0,
  };
  for (const g of invoiceStatusGroups) {
    const status = g.status as keyof DashboardInvoiceStatusDist;
    if (status in invoiceStatusDistribution) {
      invoiceStatusDistribution[status] = g._count.id;
    }
  }

  const result: DashboardRangeAnalytics = {
    from: range.from,
    to: range.to,
    granularity,
    trends,
    orderStatusDistribution,
    invoiceStatusDistribution,
    topProducts,
  };
  await setCache(cacheKey, result, 300, { fetchedAt: cacheReadStartedAt });
  return result;
}
