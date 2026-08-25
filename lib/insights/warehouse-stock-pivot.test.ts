import { describe, expect, it } from "vitest";
import type { WarehouseStockSummary } from "@/types/stock-allocation";
import {
  filterWarehouseStockPivot,
  listWarehouseStockPivotTypes,
} from "./warehouse-stock-pivot";

const FIXTURE: WarehouseStockSummary[] = [
  {
    warehouseId: "wh-a",
    warehouseName: "Main",
    warehouseType: "main",
    totalProducts: 3,
    totalQuantity: 80,
    totalReserved: 10,
    totalValue: 4000,
  },
  {
    warehouseId: "wh-b",
    warehouseName: "East",
    warehouseType: "storage",
    totalProducts: 2,
    totalQuantity: 20,
    totalReserved: 0,
    totalValue: 1000,
  },
  {
    warehouseId: "wh-c",
    warehouseName: "Empty",
    totalProducts: 0,
    totalQuantity: 0,
    totalReserved: 0,
    totalValue: 0,
  },
];

describe("listWarehouseStockPivotTypes", () => {
  it("returns distinct type chips including unset", () => {
    const types = listWarehouseStockPivotTypes(FIXTURE);
    expect(types.map((t) => t.key)).toEqual(["main", "storage", "unset"]);
    expect(types.find((t) => t.key === "unset")?.label).toBe("Unset");
  });
});

describe("filterWarehouseStockPivot", () => {
  it("returns all rows when filters are open", () => {
    expect(
      filterWarehouseStockPivot(FIXTURE, {
        typeKey: "all",
        reservedOnly: false,
      }),
    ).toHaveLength(3);
  });

  it("filters by warehouse type", () => {
    const rows = filterWarehouseStockPivot(FIXTURE, {
      typeKey: "storage",
      reservedOnly: false,
    });
    expect(rows.map((r) => r.warehouseId)).toEqual(["wh-b"]);
  });

  it("filters to rows with reserved units", () => {
    const rows = filterWarehouseStockPivot(FIXTURE, {
      typeKey: "all",
      reservedOnly: true,
    });
    expect(rows.map((r) => r.warehouseId)).toEqual(["wh-a"]);
  });

  it("combines type and reserved filters", () => {
    const rows = filterWarehouseStockPivot(FIXTURE, {
      typeKey: "storage",
      reservedOnly: true,
    });
    expect(rows).toEqual([]);
  });
});
