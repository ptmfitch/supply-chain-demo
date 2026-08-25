import { describe, expect, it } from "vitest";
import {
  CBM_STATUS_DARK,
  CBM_STATUS_LIGHT,
  COLOUR_BLIND_FOUC_SCRIPT,
  COLOUR_BLIND_STORAGE_KEY,
  getCatalogStockPieColors,
  getCategoricalChartColors,
  parseColourBlindStorage,
} from "./colour-blind-mode";

describe("colour-blind-mode (REQ-0230)", () => {
  it("parses localStorage strings", () => {
    expect(parseColourBlindStorage("true")).toBe(true);
    expect(parseColourBlindStorage("false")).toBe(false);
    expect(parseColourBlindStorage(null)).toBe(false);
    expect(parseColourBlindStorage("1")).toBe(false);
  });

  it("embeds the storage key in the FOUC script", () => {
    expect(COLOUR_BLIND_FOUC_SCRIPT).toContain(COLOUR_BLIND_STORAGE_KEY);
    expect(COLOUR_BLIND_FOUC_SCRIPT).toContain("data-colour-blind");
  });

  it("keeps default catalog pie hues when colour-blind is off", () => {
    expect(
      getCatalogStockPieColors({ colourBlind: false, dark: false }),
    ).toEqual(["#10b981", "#f59e0b", "#ef4444"]);
  });

  it("uses Figma light status hexes for catalog pie in colour-blind light", () => {
    expect(
      getCatalogStockPieColors({ colourBlind: true, dark: false }),
    ).toEqual([
      CBM_STATUS_LIGHT.ok,
      CBM_STATUS_LIGHT.warn,
      CBM_STATUS_LIGHT.crit,
    ]);
    expect(CBM_STATUS_LIGHT.ok).toBe("#0072B2");
    expect(CBM_STATUS_LIGHT.warn).toBe("#8F6200");
    expect(CBM_STATUS_LIGHT.crit).toBe("#1F2937");
  });

  it("does not use charcoal critical on dark colour-blind charts", () => {
    expect(CBM_STATUS_DARK.crit).not.toBe("#1F2937");
    expect(CBM_STATUS_DARK.crit).toBe("#E5E7EB");
    expect(
      getCatalogStockPieColors({ colourBlind: true, dark: true })[2],
    ).toBe(CBM_STATUS_DARK.crit);
  });

  it("swaps categorical chart colours when colour-blind is on", () => {
    const def = getCategoricalChartColors(false);
    const cbm = getCategoricalChartColors(true);
    expect(def[1]).toBe("#00C49F");
    expect(cbm[0]).toBe("#0072B2");
    expect(cbm).not.toEqual(def);
  });
});
