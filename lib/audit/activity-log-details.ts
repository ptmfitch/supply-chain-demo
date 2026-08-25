/**
 * Flatten an audit-log row into human-readable detail lines.
 * Shared by the activity table and CSV/Excel export.
 */

import type { AuditLog } from "@/types";

function asRecord(details: AuditLog["details"]): Record<string, unknown> | null {
  if (details == null) return null;
  if (typeof details === "object" && !Array.isArray(details)) {
    return details;
  }
  if (typeof details === "string") {
    try {
      const parsed = JSON.parse(details) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

/** Build activity details: action + entity, then dynamic lines from details. */
export function getActivityDetailLines(log: AuditLog): string[] {
  const action =
    log.action.charAt(0).toUpperCase() +
    (log.action?.slice(1) ?? "").replace(/_/g, " ");
  const entityLabel = log.entityType.replace(/_/g, " ");
  const shortId = log.entityId ? ` …${log.entityId.slice(-6)}` : "";
  const lines: string[] = [`${action} ${entityLabel}${shortId}`];

  const detailsObj = asRecord(log.details);
  if (!detailsObj) return lines;

  const d = detailsObj as Record<string, unknown> & {
    message?: string;
    summary?: string;
    statusFrom?: string;
    statusTo?: string;
    trackingNumber?: string;
    trackingCarrier?: string;
    labelSource?: string;
    productName?: string;
    orderNumber?: string;
    invoiceNumber?: string;
    subject?: string;
    fieldsUpdated?: string[];
    name?: string;
  };

  if (d.statusFrom != null && d.statusTo != null) {
    lines.push(`Status: ${String(d.statusFrom)} → ${String(d.statusTo)}`);
  }
  if (d.trackingNumber != null && String(d.trackingNumber).trim()) {
    const carrier = d.trackingCarrier ? ` (${String(d.trackingCarrier)})` : "";
    lines.push(`Tracking: ${String(d.trackingNumber)}${carrier}`);
  }
  if (d.labelSource != null && String(d.labelSource).trim()) {
    lines.push(`Label: ${String(d.labelSource)}`);
  }
  if (d.productName != null && String(d.productName).trim()) {
    lines.push(`Product: ${String(d.productName)}`);
  }
  if (d.orderNumber != null && String(d.orderNumber).trim()) {
    lines.push(`Order: ${String(d.orderNumber)}`);
  }
  if (d.invoiceNumber != null && String(d.invoiceNumber).trim()) {
    lines.push(`Invoice: ${String(d.invoiceNumber)}`);
  }
  if (d.subject != null && String(d.subject).trim()) {
    lines.push(`Subject: ${String(d.subject)}`);
  }
  if (d.rating != null && d.rating !== "") {
    lines.push(`Rating: ${d.rating}/5`);
  }
  if (Array.isArray(d.fieldsUpdated) && d.fieldsUpdated.length > 0) {
    const labels = d.fieldsUpdated.map((f) =>
      String(f)
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase())
        .trim(),
    );
    lines.push(`Fields updated: ${labels.join(", ")}`);
  }
  if (d.name != null && String(d.name).trim() && !d.productName) {
    lines.push(`Name: ${String(d.name)}`);
  }
  if (d.sku != null && String(d.sku).trim()) {
    lines.push(`SKU: ${String(d.sku)}`);
  }
  const msg = d.message ?? d.summary;
  if (typeof msg === "string" && msg.trim()) {
    lines.push(msg.trim());
  }

  return lines;
}
