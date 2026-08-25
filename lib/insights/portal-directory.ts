/**
 * SCD-15 — pure helpers for the admin portal directories (client-safe).
 * Row builders merge Prisma aggregates into directory rows; the activity
 * filter classifies rows by their last activity date.
 */

import type { ClientDirectoryRow, SupplierDirectoryRow } from "@/types";

export type DirectoryActivityFilter =
  | "all"
  | "active30"
  | "active90"
  | "dormant";

export const DIRECTORY_ACTIVITY_OPTIONS: {
  key: DirectoryActivityFilter;
  label: string;
}[] = [
  { key: "all", label: "All" },
  { key: "active30", label: "Active 30d" },
  { key: "active90", label: "Active 90d" },
  { key: "dormant", label: "Dormant" },
];

const DAY_MS = 86_400_000;
/** Dormant = no activity in the last 90 days (or never active). */
const DORMANT_AFTER_DAYS = 90;

export function directoryActivityMatches(
  lastActivityAt: string | null,
  filter: DirectoryActivityFilter,
  now: Date = new Date(),
): boolean {
  if (filter === "all") return true;
  const last = lastActivityAt ? new Date(lastActivityAt).getTime() : null;
  const ageDays =
    last == null ? Number.POSITIVE_INFINITY : (now.getTime() - last) / DAY_MS;
  switch (filter) {
    case "active30":
      return ageDays <= 30;
    case "active90":
      return ageDays <= 90;
    case "dormant":
      return ageDays > DORMANT_AFTER_DAYS;
    default: {
      const exhaustive: never = filter;
      throw new Error(`Unknown activity filter: ${exhaustive}`);
    }
  }
}

export function filterDirectoryRows<
  T extends { lastActivityAt: string | null; name: string; email: string | null },
>(
  rows: T[],
  searchTerm: string,
  activityFilter: DirectoryActivityFilter,
  now: Date = new Date(),
): T[] {
  const term = searchTerm.trim().toLowerCase();
  return rows.filter((row) => {
    const searchMatch =
      !term ||
      row.name.toLowerCase().includes(term) ||
      (row.email ?? "").toLowerCase().includes(term);
    return (
      searchMatch && directoryActivityMatches(row.lastActivityAt, activityFilter, now)
    );
  });
}

function maxIso(...dates: (string | null | undefined)[]): string | null {
  let max: string | null = null;
  for (const d of dates) {
    if (!d) continue;
    if (max == null || d > max) max = d;
  }
  return max;
}

export type ClientUserInput = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
};

export type ClientOrderAggregate = {
  clientId: string;
  orderCount: number;
  /** Sum of order totals excluding cancelled orders */
  revenueExclCancelled: number;
  lastOrderAt: string | null;
};

export type ClientInvoiceAggregate = {
  clientId: string;
  invoiceCount: number;
  lastInvoiceAt: string | null;
};

export function buildClientDirectoryRows(
  users: ClientUserInput[],
  orderAggs: ClientOrderAggregate[],
  invoiceAggs: ClientInvoiceAggregate[],
): ClientDirectoryRow[] {
  const orderByClient = new Map(orderAggs.map((a) => [a.clientId, a]));
  const invoiceByClient = new Map(invoiceAggs.map((a) => [a.clientId, a]));
  return users.map((u) => {
    const o = orderByClient.get(u.id);
    const i = invoiceByClient.get(u.id);
    return {
      userId: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      joinedAt: u.createdAt,
      orderCount: o?.orderCount ?? 0,
      invoiceCount: i?.invoiceCount ?? 0,
      totalRevenue: o?.revenueExclCancelled ?? 0,
      lastActivityAt: maxIso(o?.lastOrderAt, i?.lastInvoiceAt),
    };
  });
}

export type SupplierEntityInput = {
  id: string;
  userId: string | null;
  name: string;
  createdAt: string;
};

export type SupplierUserInput = {
  id: string;
  email: string;
  image: string | null;
};

export type SupplierProductAggregate = {
  supplierId: string;
  productCount: number;
  inventoryValue: number;
  lastProductAt: string | null;
};

export type SupplierOrderAggregate = {
  supplierId: string;
  orderCount: number;
  lastOrderAt: string | null;
};

export function buildSupplierDirectoryRows(
  suppliers: SupplierEntityInput[],
  users: SupplierUserInput[],
  productAggs: SupplierProductAggregate[],
  orderAggs: SupplierOrderAggregate[],
): SupplierDirectoryRow[] {
  const userById = new Map(users.map((u) => [u.id, u]));
  const productBySupplier = new Map(productAggs.map((a) => [a.supplierId, a]));
  const orderBySupplier = new Map(orderAggs.map((a) => [a.supplierId, a]));

  return suppliers.map((s) => {
    const user = s.userId ? userById.get(s.userId) : undefined;
    const p = productBySupplier.get(s.id);
    const o = orderBySupplier.get(s.id);
    return {
      supplierId: s.id,
      userId: s.userId,
      name: s.name,
      email: user?.email ?? null,
      image: user?.image ?? null,
      joinedAt: s.createdAt,
      productCount: p?.productCount ?? 0,
      inventoryValue: p?.inventoryValue ?? 0,
      orderCount: o?.orderCount ?? 0,
      lastActivityAt: maxIso(o?.lastOrderAt, p?.lastProductAt),
    };
  });
}
