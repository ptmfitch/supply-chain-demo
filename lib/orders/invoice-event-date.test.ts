import { describe, expect, it } from "vitest";
import { resolveInvoiceSecondaryEvent } from "./invoice-event-date";

describe("resolveInvoiceSecondaryEvent", () => {
  it("prefers paidAt when paid", () => {
    expect(
      resolveInvoiceSecondaryEvent({
        status: "paid",
        paidAt: "2026-06-15T00:00:00.000Z",
        dueDate: "2026-07-15T00:00:00.000Z",
      }),
    ).toEqual({ date: "2026-06-15T00:00:00.000Z", kind: "paid" });
  });

  it("uses cancelledAt when cancelled", () => {
    expect(
      resolveInvoiceSecondaryEvent({
        status: "cancelled",
        cancelledAt: "2026-06-01T00:00:00.000Z",
        dueDate: "2026-07-15T00:00:00.000Z",
      }),
    ).toEqual({ date: "2026-06-01T00:00:00.000Z", kind: "cancelled" });
  });

  it("uses refunded kind with paidAt", () => {
    expect(
      resolveInvoiceSecondaryEvent({
        status: "refunded",
        paidAt: "2026-06-15T00:00:00.000Z",
      }),
    ).toEqual({ date: "2026-06-15T00:00:00.000Z", kind: "refunded" });
  });

  it("falls back to due date for sent", () => {
    // Future-relative so the test never rots as the real clock passes a fixed fixture date
    const futureDue = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(
      resolveInvoiceSecondaryEvent({
        status: "sent",
        sentAt: "2026-07-15T00:00:00.000Z",
        dueDate: futureDue,
      }),
    ).toMatchObject({ kind: "due", date: futureDue });
  });

  it("marks a past due date as overdue for sent", () => {
    const pastDue = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(
      resolveInvoiceSecondaryEvent({
        status: "sent",
        sentAt: "2026-07-15T00:00:00.000Z",
        dueDate: pastDue,
      }),
    ).toMatchObject({ kind: "overdue", date: pastDue });
  });
});
