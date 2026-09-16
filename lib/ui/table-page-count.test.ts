import { describe, expect, it } from "vitest";
import {
  displayTablePageCount,
  formatTablePageLabel,
  tablePageCountFromRows,
} from "./table-page-count";

describe("displayTablePageCount (REQ-0231)", () => {
  it("shows at least one page when TanStack reports 0", () => {
    expect(displayTablePageCount(0)).toBe(1);
  });

  it("keeps a positive page count", () => {
    expect(displayTablePageCount(1)).toBe(1);
    expect(displayTablePageCount(5)).toBe(5);
  });

  it("floors fractional counts and rejects non-finite or negative values", () => {
    expect(displayTablePageCount(4.9)).toBe(4);
    expect(displayTablePageCount(-3)).toBe(1);
    expect(displayTablePageCount(Number.NaN)).toBe(1);
    expect(displayTablePageCount(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("tablePageCountFromRows", () => {
  it("uses one page for an empty or invalid row set", () => {
    expect(tablePageCountFromRows(0, 10)).toBe(1);
    expect(tablePageCountFromRows(-4, 10)).toBe(1);
    expect(tablePageCountFromRows(Number.NaN, 10)).toBe(1);
  });

  it("ceils partial pages and treats a missing page size as 1", () => {
    expect(tablePageCountFromRows(10, 10)).toBe(1);
    expect(tablePageCountFromRows(11, 10)).toBe(2);
    expect(tablePageCountFromRows(25, 10)).toBe(3);
    expect(tablePageCountFromRows(10, 0)).toBe(10);
    expect(tablePageCountFromRows(10, -5)).toBe(10);
  });
});

describe("formatTablePageLabel", () => {
  it("renders Page 1 of 1 for an empty table", () => {
    expect(formatTablePageLabel(0, 0)).toBe("Page 1 of 1");
  });

  it("uses a 1-based page index against the display count", () => {
    expect(formatTablePageLabel(2, 5)).toBe("Page 3 of 5");
    expect(formatTablePageLabel(-1, 3)).toBe("Page 1 of 3");
    expect(formatTablePageLabel(Number.NaN, 2)).toBe("Page 1 of 2");
  });
});
