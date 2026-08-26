/**
 * SCD-22 — Admin sidebar badge helpers: actionable ticket/review counts.
 * Client-safe (no Prisma). Used by getAdminCounts and AdminSidebar.
 */

import type { AdminCounts, ProductReviewStatus, SupportTicketStatus } from "@/types";

/** Assigned tickets that still need admin attention. */
export const ACTIONABLE_TICKET_STATUSES = [
  "open",
  "in_progress",
] as const satisfies readonly SupportTicketStatus[];

/** Reviews that still need admin attention. */
export const ACTIONABLE_REVIEW_STATUS = "pending" satisfies ProductReviewStatus;

const ACTIONABLE_ADMIN_BADGE_KEYS = new Set<keyof AdminCounts>([
  "supportTickets",
  "productReviews",
]);

export function isActionableTicketStatus(
  status: SupportTicketStatus,
): boolean {
  switch (status) {
    case "open":
    case "in_progress":
      return true;
    case "resolved":
    case "closed":
      return false;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function isActionableReviewStatus(
  status: ProductReviewStatus,
): boolean {
  switch (status) {
    case "pending":
      return true;
    case "approved":
    case "rejected":
      return false;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/** Prisma `where` for assigned tickets that need attention (SCD-22). */
export function actionableAssignedTicketWhere(assignedToId: string) {
  return {
    assignedToId,
    status: { in: [...ACTIONABLE_TICKET_STATUSES] },
  };
}

/** Prisma `where` for pending reviews on the admin's owned products (SCD-22). */
export function actionableOwnedReviewWhere(productIds: readonly string[]) {
  return {
    productId: { in: [...productIds] },
    status: ACTIONABLE_REVIEW_STATUS,
  };
}

export function isActionableAdminBadgeCount(count: number): boolean {
  return Number.isFinite(count) && count > 0;
}

/**
 * Tickets/reviews hide at 0 (actionable empty), including stale refetch pulses.
 * Other keys keep the empty pill. Cold load (unknown count) still shows a pulse.
 */
export function shouldShowAdminCountBadge(
  countKey: keyof AdminCounts | undefined,
  count: number | undefined,
  countsLoading = false,
): boolean {
  if (!countKey) return false;
  if (ACTIONABLE_ADMIN_BADGE_KEYS.has(countKey)) {
    if (isActionableAdminBadgeCount(count ?? 0)) return true;
    return countsLoading && count === undefined;
  }
  return true;
}

export function adminCountBadgeAriaLabel(
  countKey: keyof AdminCounts | undefined,
  count: number | undefined,
  countsLoading: boolean,
): string | undefined {
  if (countsLoading) return "Loading count";
  if (!countKey || count === undefined) return undefined;

  switch (countKey) {
    case "supportTickets":
      return count === 1
        ? "1 open or in-progress ticket"
        : `${count} open or in-progress tickets`;
    case "productReviews":
      return count === 1
        ? "1 pending review"
        : `${count} pending reviews`;
    case "clientOrders":
    case "clientInvoices":
    case "products":
    case "warehouses":
    case "suppliers":
    case "clients":
    case "users":
      return `${count} items`;
    default: {
      const _exhaustive: never = countKey;
      return _exhaustive;
    }
  }
}
