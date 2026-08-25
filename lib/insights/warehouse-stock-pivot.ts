/**
 * REQ-0228 — client-safe filters for the warehouse stock pivot grid.
 * Pure transforms over WarehouseStockSummary rows (no DB).
 */

import { getWarehouseTypeLabel } from "@/lib/ui/warehouse-type-styles";
import type { WarehouseStockSummary } from "@/types/stock-allocation";

export type WarehouseStockPivotTypeOption = {
  key: string;
  label: string;
};

export type WarehouseStockPivotFilter = {
  typeKey: string | "all";
  reservedOnly: boolean;
};

const UNSET_TYPE_KEY = "unset";

function warehouseTypeKey(type?: string | null): string {
  const key = (type || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
  return key || UNSET_TYPE_KEY;
}

/** Distinct warehouse types present in the summary, for filter chips. */
export function listWarehouseStockPivotTypes(
  rows: WarehouseStockSummary[],
): WarehouseStockPivotTypeOption[] {
  const seen = new Map<string, string>();
  for (const row of rows) {
    const key = warehouseTypeKey(row.warehouseType);
    if (seen.has(key)) continue;
    const label =
      key === UNSET_TYPE_KEY
        ? "Unset"
        : getWarehouseTypeLabel(row.warehouseType);
    seen.set(key, label);
  }
  return [...seen.entries()]
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Filter warehouse stock rows by type and reserved-only. */
export function filterWarehouseStockPivot(
  rows: WarehouseStockSummary[],
  filter: WarehouseStockPivotFilter,
): WarehouseStockSummary[] {
  return rows.filter((row) => {
    if (filter.typeKey !== "all") {
      if (warehouseTypeKey(row.warehouseType) !== filter.typeKey) return false;
    }
    if (filter.reservedOnly && row.totalReserved <= 0) return false;
    return true;
  });
}
