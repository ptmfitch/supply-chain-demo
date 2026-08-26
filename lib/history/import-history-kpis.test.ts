import { describe, expect, it } from "vitest";
import { summarizeImportHistoryKpis } from "./import-history-kpis";

describe("summarizeImportHistoryKpis", () => {
  it("returns zeros for an empty list", () => {
    expect(summarizeImportHistoryKpis([])).toEqual({
      totalImports: 0,
      rowsSucceeded: 0,
      rowsFailed: 0,
    });
  });

  it("sums mixed success and fail rows across imports", () => {
    expect(
      summarizeImportHistoryKpis([
        { successRows: 10, failedRows: 2 },
        { successRows: 0, failedRows: 5 },
        { successRows: 3, failedRows: 1 },
      ]),
    ).toEqual({
      totalImports: 3,
      rowsSucceeded: 13,
      rowsFailed: 8,
    });
  });

  it("counts processing rows with zeros toward total imports only", () => {
    expect(
      summarizeImportHistoryKpis([
        { successRows: 8, failedRows: 1 },
        { successRows: 0, failedRows: 0 },
        { successRows: 0, failedRows: 0 },
      ]),
    ).toEqual({
      totalImports: 3,
      rowsSucceeded: 8,
      rowsFailed: 1,
    });
  });
});
