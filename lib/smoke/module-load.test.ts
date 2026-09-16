import { describe, expect, it } from "vitest";
import { DIALOG_FORM_FIELD_ROSE } from "@/components/shared/dialog-form-field";
import { filterDirectoryRows } from "@/lib/insights/portal-directory";
import { filterWarehouseStockPivot } from "@/lib/insights/warehouse-stock-pivot";
import { formatTablePageLabel } from "@/lib/ui/table-page-count";

describe("daily smoke: modules from 16 Sep 2026 PRs load", () => {
  it("loads dialog field tokens used by the light-mode contrast sweep", () => {
    expect(DIALOG_FORM_FIELD_ROSE).toContain("backdrop-blur-md");
    expect(DIALOG_FORM_FIELD_ROSE.length).toBeGreaterThan(20);
  });

  it("loads directory and warehouse pivot filters", () => {
    expect(filterDirectoryRows([], "", "all")).toEqual([]);
    expect(filterWarehouseStockPivot([], { typeKey: "all", reservedOnly: false })).toEqual(
      [],
    );
  });

  it("formats an empty-table page label", () => {
    expect(formatTablePageLabel(0, 0)).toBe("Page 1 of 1");
  });
});
