/**
 * SCD-21 — Shared list-filter predicates and CSV/Excel row mapping for
 * Support Tickets, Product Reviews, and Import History exports.
 * UI-only; no cache/invalidation changes.
 */

import { formatStableDate } from "@/lib/format";
import type { ImportHistoryForPage, ProductReview, SupportTicket } from "@/types";

export type AdminExportCsvColumn = { header: string; key: string };
export type AdminExportExcelColumn = { header: string; key: string; width: number };

const EMPTY_CELL = "-";

function displayOrDash(value: string | null | undefined): string {
  if (value == null) return EMPTY_CELL;
  return value === "" ? EMPTY_CELL : value;
}

function formatOptionalStableDate(
  value: string | Date | number | null | undefined,
): string {
  if (value == null || value === "") return EMPTY_CELL;
  return formatStableDate(value);
}

export type SupportTicketListFilters = {
  searchTerm: string;
  selectedStatuses: string[];
  selectedPriorities: string[];
};

/** Same predicates as `SupportTicketTable` (search subject/description; status; priority). */
export function filterSupportTickets(
  tickets: SupportTicket[],
  { searchTerm, selectedStatuses, selectedPriorities }: SupportTicketListFilters,
): SupportTicket[] {
  return tickets.filter((t) => {
    const searchMatch =
      !searchTerm ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch =
      selectedStatuses.length === 0 || selectedStatuses.includes(t.status);
    const priorityMatch =
      selectedPriorities.length === 0 ||
      selectedPriorities.includes(t.priority);
    return searchMatch && statusMatch && priorityMatch;
  });
}

export const SUPPORT_TICKET_EXPORT_FILE_STEM = "stockly-support-tickets";
export const SUPPORT_TICKET_EXPORT_SHEET = "Support Tickets";

export const SUPPORT_TICKET_EXPORT_COLUMNS: AdminExportCsvColumn[] = [
  { header: "Ticket Number", key: "Ticket Number" },
  { header: "Subject", key: "Subject" },
  { header: "Status", key: "Status" },
  { header: "Priority", key: "Priority" },
  { header: "Creator", key: "Creator" },
  { header: "Assigned To", key: "Assigned To" },
  { header: "Created", key: "Created" },
];

export const SUPPORT_TICKET_EXPORT_EXCEL_COLUMNS: AdminExportExcelColumn[] = [
  { header: "Ticket Number", key: "Ticket Number", width: 22 },
  { header: "Subject", key: "Subject", width: 36 },
  { header: "Status", key: "Status", width: 14 },
  { header: "Priority", key: "Priority", width: 12 },
  { header: "Creator", key: "Creator", width: 22 },
  { header: "Assigned To", key: "Assigned To", width: 22 },
  { header: "Created", key: "Created", width: 16 },
];

export function mapSupportTicketsToExportRows(
  tickets: SupportTicket[],
): Record<string, unknown>[] {
  return tickets.map((ticket) => ({
    "Ticket Number": ticket.ticketNumber || ticket.id,
    Subject: ticket.subject,
    Status: ticket.status,
    Priority: ticket.priority,
    Creator: displayOrDash(ticket.creatorName),
    "Assigned To": displayOrDash(ticket.assignedToName),
    Created: formatStableDate(ticket.createdAt),
  }));
}

export type ProductReviewListFilters = {
  searchTerm: string;
  selectedStatuses: string[];
  selectedRatings: string[];
};

/** Same predicates as `ProductReviewTable` (search name/comment/SKU; status; rating string). */
export function filterProductReviews(
  reviews: ProductReview[],
  { searchTerm, selectedStatuses, selectedRatings }: ProductReviewListFilters,
): ProductReview[] {
  return reviews.filter((r) => {
    const searchMatch =
      !searchTerm ||
      r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.productSku ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch =
      selectedStatuses.length === 0 || selectedStatuses.includes(r.status);
    const ratingMatch =
      selectedRatings.length === 0 ||
      selectedRatings.includes(String(r.rating));
    return searchMatch && statusMatch && ratingMatch;
  });
}

export const PRODUCT_REVIEW_EXPORT_FILE_STEM = "stockly-product-reviews";
export const PRODUCT_REVIEW_EXPORT_SHEET = "Product Reviews";

export const PRODUCT_REVIEW_EXPORT_COLUMNS: AdminExportCsvColumn[] = [
  { header: "Product", key: "Product" },
  { header: "SKU", key: "SKU" },
  { header: "Rating", key: "Rating" },
  { header: "Status", key: "Status" },
  { header: "Comment", key: "Comment" },
  { header: "Reviewer", key: "Reviewer" },
  { header: "Created", key: "Created" },
];

export const PRODUCT_REVIEW_EXPORT_EXCEL_COLUMNS: AdminExportExcelColumn[] = [
  { header: "Product", key: "Product", width: 28 },
  { header: "SKU", key: "SKU", width: 16 },
  { header: "Rating", key: "Rating", width: 10 },
  { header: "Status", key: "Status", width: 12 },
  { header: "Comment", key: "Comment", width: 40 },
  { header: "Reviewer", key: "Reviewer", width: 22 },
  { header: "Created", key: "Created", width: 16 },
];

export function mapProductReviewsToExportRows(
  reviews: ProductReview[],
): Record<string, unknown>[] {
  return reviews.map((review) => ({
    Product: review.productName,
    SKU: displayOrDash(review.productSku),
    Rating: review.rating,
    Status: review.status,
    Comment: review.comment,
    Reviewer: displayOrDash(review.reviewerName),
    Created: formatStableDate(review.createdAt),
  }));
}

export type ImportHistoryListFilters = {
  searchTerm: string;
  selectedImportTypes: string[];
  selectedStatuses: string[];
};

/** Same predicates as `HistoryTable` (search fileName/importType; type; status). */
export function filterImportHistory(
  records: ImportHistoryForPage[],
  { searchTerm, selectedImportTypes, selectedStatuses }: ImportHistoryListFilters,
): ImportHistoryForPage[] {
  return records.filter((record) => {
    const searchMatch =
      !searchTerm ||
      record.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.importType.toLowerCase().includes(searchTerm.toLowerCase());
    const importTypeMatch =
      selectedImportTypes.length === 0 ||
      selectedImportTypes.includes(record.importType);
    const statusMatch =
      selectedStatuses.length === 0 ||
      selectedStatuses.includes(record.status);
    return searchMatch && importTypeMatch && statusMatch;
  });
}

export const IMPORT_HISTORY_EXPORT_FILE_STEM = "stockly-import-history";
export const IMPORT_HISTORY_EXPORT_SHEET = "Import History";

export const IMPORT_HISTORY_EXPORT_COLUMNS: AdminExportCsvColumn[] = [
  { header: "File Name", key: "File Name" },
  { header: "Import Type", key: "Import Type" },
  { header: "Status", key: "Status" },
  { header: "Total Rows", key: "Total Rows" },
  { header: "Success Rows", key: "Success Rows" },
  { header: "Failed Rows", key: "Failed Rows" },
  { header: "Created", key: "Created" },
  { header: "Completed", key: "Completed" },
];

export const IMPORT_HISTORY_EXPORT_EXCEL_COLUMNS: AdminExportExcelColumn[] = [
  { header: "File Name", key: "File Name", width: 32 },
  { header: "Import Type", key: "Import Type", width: 14 },
  { header: "Status", key: "Status", width: 14 },
  { header: "Total Rows", key: "Total Rows", width: 12 },
  { header: "Success Rows", key: "Success Rows", width: 14 },
  { header: "Failed Rows", key: "Failed Rows", width: 14 },
  { header: "Created", key: "Created", width: 16 },
  { header: "Completed", key: "Completed", width: 16 },
];

export function mapImportHistoryToExportRows(
  records: ImportHistoryForPage[],
): Record<string, unknown>[] {
  return records.map((record) => ({
    "File Name": record.fileName,
    "Import Type": record.importType,
    Status: record.status,
    "Total Rows": record.totalRows,
    "Success Rows": record.successRows,
    "Failed Rows": record.failedRows,
    Created: formatStableDate(record.createdAt),
    Completed: formatOptionalStableDate(record.completedAt),
  }));
}
