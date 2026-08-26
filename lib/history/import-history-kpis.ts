/**
 * SCD-23 / REQ-0233 — Import History list KPI totals from existing list rows.
 * No extra API or cache domain: sums successRows / failedRows on ImportHistoryForPage.
 */

import type { ImportHistoryForPage } from "@/types";

export type ImportHistoryKpiRow = Pick<
  ImportHistoryForPage,
  "successRows" | "failedRows"
>;

export type ImportHistoryKpis = {
  totalImports: number;
  rowsSucceeded: number;
  rowsFailed: number;
};

/** Headline numbers for the Import History stat-card strip. */
export function summarizeImportHistoryKpis(
  records: ImportHistoryKpiRow[],
): ImportHistoryKpis {
  let rowsSucceeded = 0;
  let rowsFailed = 0;
  for (const row of records) {
    rowsSucceeded += row.successRows;
    rowsFailed += row.failedRows;
  }
  return {
    totalImports: records.length,
    rowsSucceeded,
    rowsFailed,
  };
}
