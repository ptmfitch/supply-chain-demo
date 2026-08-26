import { describe, expect, it } from "vitest";
import type { ProductReviewStatus, SupportTicketStatus } from "@/types";
import {
  ACTIONABLE_REVIEW_STATUS,
  ACTIONABLE_TICKET_STATUSES,
  actionableAssignedTicketWhere,
  actionableOwnedReviewWhere,
  adminCountBadgeAriaLabel,
  isActionableAdminBadgeCount,
  isActionableReviewStatus,
  isActionableTicketStatus,
  shouldShowAdminCountBadge,
} from "./admin-count-badges";

describe("admin-count-badges (SCD-22)", () => {
  it("treats open and in_progress as the only actionable ticket statuses", () => {
    expect([...ACTIONABLE_TICKET_STATUSES]).toEqual(["open", "in_progress"]);
    const tickets: SupportTicketStatus[] = [
      "open",
      "in_progress",
      "resolved",
      "closed",
    ];
    expect(tickets.filter(isActionableTicketStatus)).toEqual([
      "open",
      "in_progress",
    ]);
  });

  it("treats pending as the only actionable review status", () => {
    expect(ACTIONABLE_REVIEW_STATUS).toBe("pending");
    const reviews: ProductReviewStatus[] = ["pending", "approved", "rejected"];
    expect(reviews.filter(isActionableReviewStatus)).toEqual(["pending"]);
  });

  it("builds assigned-ticket where with open OR in_progress", () => {
    expect(actionableAssignedTicketWhere("admin-1")).toEqual({
      assignedToId: "admin-1",
      status: { in: ["open", "in_progress"] },
    });
  });

  it("builds owned-review where with pending and the same product-id scope", () => {
    expect(actionableOwnedReviewWhere(["p1", "p2"])).toEqual({
      productId: { in: ["p1", "p2"] },
      status: "pending",
    });
  });

  it("isActionableAdminBadgeCount is true only for positive finite counts", () => {
    expect(isActionableAdminBadgeCount(0)).toBe(false);
    expect(isActionableAdminBadgeCount(-1)).toBe(false);
    expect(isActionableAdminBadgeCount(Number.NaN)).toBe(false);
    expect(isActionableAdminBadgeCount(1)).toBe(true);
    expect(isActionableAdminBadgeCount(99)).toBe(true);
  });

  it("hides ticket and review badges when the actionable count is 0", () => {
    expect(shouldShowAdminCountBadge("supportTickets", 0)).toBe(false);
    expect(shouldShowAdminCountBadge("productReviews", 0)).toBe(false);
    expect(shouldShowAdminCountBadge("supportTickets", 3)).toBe(true);
    expect(shouldShowAdminCountBadge("productReviews", 1)).toBe(true);
    expect(shouldShowAdminCountBadge(undefined, 4)).toBe(false);
  });

  it("keeps empty pills at zero for other sidebar count keys", () => {
    expect(shouldShowAdminCountBadge("products", 0)).toBe(true);
    expect(shouldShowAdminCountBadge("users", 0)).toBe(true);
    expect(shouldShowAdminCountBadge("clientOrders", 0)).toBe(true);
    expect(shouldShowAdminCountBadge("users", 12)).toBe(true);
  });

  it("describes actionable items in aria-labels for tickets and reviews", () => {
    expect(adminCountBadgeAriaLabel("supportTickets", 3, false)).toBe(
      "3 open or in-progress tickets",
    );
    expect(adminCountBadgeAriaLabel("supportTickets", 1, false)).toBe(
      "1 open or in-progress ticket",
    );
    expect(adminCountBadgeAriaLabel("productReviews", 5, false)).toBe(
      "5 pending reviews",
    );
    expect(adminCountBadgeAriaLabel("productReviews", 1, false)).toBe(
      "1 pending review",
    );
    expect(adminCountBadgeAriaLabel("products", 8, false)).toBe("8 items");
    expect(adminCountBadgeAriaLabel("supportTickets", 2, true)).toBe(
      "Loading count",
    );
    expect(
      adminCountBadgeAriaLabel("supportTickets", undefined, false),
    ).toBeUndefined();
  });
});
