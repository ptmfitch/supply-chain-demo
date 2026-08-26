/**
 * SCD-21 — filtered export rows for tickets, reviews, and import history.
 */

import { describe, expect, it } from "vitest";
import { formatStableDate } from "@/lib/format";
import type { ImportHistoryForPage, ProductReview, SupportTicket } from "@/types";
import {
  filterImportHistory,
  filterProductReviews,
  filterSupportTickets,
  IMPORT_HISTORY_EXPORT_FILE_STEM,
  mapImportHistoryToExportRows,
  mapProductReviewsToExportRows,
  mapSupportTicketsToExportRows,
  PRODUCT_REVIEW_EXPORT_FILE_STEM,
  SUPPORT_TICKET_EXPORT_FILE_STEM,
} from "./admin-list-export";

const CREATED = "2026-03-15T12:00:00.000Z";
const COMPLETED = "2026-03-16T18:00:00.000Z";

function ticket(overrides: Partial<SupportTicket> = {}): SupportTicket {
  return {
    id: "ticket-id-1",
    subject: "Cannot login",
    description: "Auth error on checkout",
    status: "open",
    priority: "high",
    userId: "u1",
    assignedToId: "a1",
    productId: null,
    orderId: null,
    supplierId: null,
    notes: null,
    createdAt: CREATED,
    updatedAt: null,
    ticketNumber: "TKT-20260315-abc123",
    creatorName: "Ada Client",
    assignedToName: "Store Owner",
    ...overrides,
  };
}

function review(overrides: Partial<ProductReview> = {}): ProductReview {
  return {
    id: "review-1",
    productId: "p1",
    userId: "u1",
    orderId: null,
    orderItemId: null,
    productName: "Wireless Headphones",
    productSku: "WH-100",
    rating: 5,
    comment: "Great battery life",
    status: "approved",
    createdAt: CREATED,
    updatedAt: null,
    reviewerName: "Ada Client",
    ...overrides,
  };
}

function history(
  overrides: Partial<ImportHistoryForPage> = {},
): ImportHistoryForPage {
  return {
    id: "hist-1",
    userId: "u1",
    importType: "products",
    fileName: "catalog-march.csv",
    fileSize: 1024,
    totalRows: 10,
    successRows: 8,
    failedRows: 2,
    errors: null,
    status: "completed",
    createdAt: CREATED,
    completedAt: COMPLETED,
    ...overrides,
  };
}

describe("filterSupportTickets", () => {
  const tickets = [
    ticket(),
    ticket({
      id: "ticket-id-2",
      subject: "Stock mismatch",
      description: "Warehouse count is off",
      status: "in_progress",
      priority: "low",
    }),
  ];

  it("returns all rows when search and filters are empty", () => {
    expect(
      filterSupportTickets(tickets, {
        searchTerm: "",
        selectedStatuses: [],
        selectedPriorities: [],
      }),
    ).toHaveLength(2);
  });

  it("searches subject and description", () => {
    expect(
      filterSupportTickets(tickets, {
        searchTerm: "LOGIN",
        selectedStatuses: [],
        selectedPriorities: [],
      }).map((t) => t.id),
    ).toEqual(["ticket-id-1"]);
    expect(
      filterSupportTickets(tickets, {
        searchTerm: "warehouse",
        selectedStatuses: [],
        selectedPriorities: [],
      }).map((t) => t.id),
    ).toEqual(["ticket-id-2"]);
  });

  it("applies status and priority together", () => {
    expect(
      filterSupportTickets(tickets, {
        searchTerm: "",
        selectedStatuses: ["open"],
        selectedPriorities: ["low"],
      }),
    ).toHaveLength(0);
    expect(
      filterSupportTickets(tickets, {
        searchTerm: "",
        selectedStatuses: ["open"],
        selectedPriorities: ["high"],
      }).map((t) => t.id),
    ).toEqual(["ticket-id-1"]);
  });
});

describe("mapSupportTicketsToExportRows", () => {
  it("maps useful list columns and uses formatStableDate for Created", () => {
    const row = mapSupportTicketsToExportRows([ticket()])[0];
    expect(row).toEqual({
      "Ticket Number": "TKT-20260315-abc123",
      Subject: "Cannot login",
      Status: "open",
      Priority: "high",
      Creator: "Ada Client",
      "Assigned To": "Store Owner",
      Created: formatStableDate(CREATED),
    });
    expect(String(row.Created)).toMatch(/Mar/);
    expect(String(row.Created)).not.toMatch(/T12:00:00/);
  });

  it("falls back to id when ticketNumber is missing", () => {
    const row = mapSupportTicketsToExportRows([
      ticket({ ticketNumber: undefined }),
    ])[0];
    expect(row["Ticket Number"]).toBe("ticket-id-1");
  });

  it("falls back to id when ticketNumber is empty", () => {
    const row = mapSupportTicketsToExportRows([ticket({ ticketNumber: "" })])[0];
    expect(row["Ticket Number"]).toBe("ticket-id-1");
  });
});

describe("filterProductReviews", () => {
  const reviews = [
    review(),
    review({
      id: "review-2",
      productName: "USB Cable",
      productSku: "USB-01",
      comment: "Frayed jacket",
      status: "pending",
      rating: 2,
    }),
  ];

  it("searches productName, comment, and productSku", () => {
    expect(
      filterProductReviews(reviews, {
        searchTerm: "headphones",
        selectedStatuses: [],
        selectedRatings: [],
      }).map((r) => r.id),
    ).toEqual(["review-1"]);
    expect(
      filterProductReviews(reviews, {
        searchTerm: "FRAYED",
        selectedStatuses: [],
        selectedRatings: [],
      }).map((r) => r.id),
    ).toEqual(["review-2"]);
    expect(
      filterProductReviews(reviews, {
        searchTerm: "usb-01",
        selectedStatuses: [],
        selectedRatings: [],
      }).map((r) => r.id),
    ).toEqual(["review-2"]);
  });

  it("matches rating as String(r.rating)", () => {
    expect(
      filterProductReviews(reviews, {
        searchTerm: "",
        selectedStatuses: [],
        selectedRatings: ["5"],
      }).map((r) => r.id),
    ).toEqual(["review-1"]);
  });

  it("applies status filter", () => {
    expect(
      filterProductReviews(reviews, {
        searchTerm: "",
        selectedStatuses: ["pending"],
        selectedRatings: [],
      }).map((r) => r.id),
    ).toEqual(["review-2"]);
  });
});

describe("mapProductReviewsToExportRows", () => {
  it("maps list columns and uses formatStableDate for Created", () => {
    const row = mapProductReviewsToExportRows([review()])[0];
    expect(row).toEqual({
      Product: "Wireless Headphones",
      SKU: "WH-100",
      Rating: 5,
      Status: "approved",
      Comment: "Great battery life",
      Reviewer: "Ada Client",
      Created: formatStableDate(CREATED),
    });
    expect(row.Created).toBe(formatStableDate(CREATED));
  });
});

describe("filterImportHistory", () => {
  const records = [
    history(),
    history({
      id: "hist-2",
      fileName: "orders-april.xlsx",
      importType: "orders",
      status: "failed",
    }),
  ];

  it("searches fileName and importType", () => {
    expect(
      filterImportHistory(records, {
        searchTerm: "MARCH",
        selectedImportTypes: [],
        selectedStatuses: [],
      }).map((r) => r.id),
    ).toEqual(["hist-1"]);
    expect(
      filterImportHistory(records, {
        searchTerm: "orders",
        selectedImportTypes: [],
        selectedStatuses: [],
      }).map((r) => r.id),
    ).toEqual(["hist-2"]);
  });

  it("applies import type and status", () => {
    expect(
      filterImportHistory(records, {
        searchTerm: "",
        selectedImportTypes: ["products"],
        selectedStatuses: ["failed"],
      }),
    ).toHaveLength(0);
    expect(
      filterImportHistory(records, {
        searchTerm: "",
        selectedImportTypes: ["orders"],
        selectedStatuses: ["failed"],
      }).map((r) => r.id),
    ).toEqual(["hist-2"]);
  });
});

describe("mapImportHistoryToExportRows", () => {
  it("maps list columns and uses formatStableDate for Created and Completed", () => {
    const row = mapImportHistoryToExportRows([history()])[0];
    expect(row).toEqual({
      "File Name": "catalog-march.csv",
      "Import Type": "products",
      Status: "completed",
      "Total Rows": 10,
      "Success Rows": 8,
      "Failed Rows": 2,
      Created: formatStableDate(CREATED),
      Completed: formatStableDate(COMPLETED),
    });
    expect(row.Created).toBe(formatStableDate(CREATED));
    expect(row.Completed).toBe(formatStableDate(COMPLETED));
  });

  it("uses dash when completedAt is missing", () => {
    const row = mapImportHistoryToExportRows([
      history({ completedAt: null, status: "processing" }),
    ])[0];
    expect(row.Completed).toBe("-");
    expect(row.Created).toBe(formatStableDate(CREATED));
  });
});

describe("export file stems", () => {
  it("uses stockly-* stems for the three admin lists", () => {
    expect(SUPPORT_TICKET_EXPORT_FILE_STEM).toBe("stockly-support-tickets");
    expect(PRODUCT_REVIEW_EXPORT_FILE_STEM).toBe("stockly-product-reviews");
    expect(IMPORT_HISTORY_EXPORT_FILE_STEM).toBe("stockly-import-history");
  });
});
