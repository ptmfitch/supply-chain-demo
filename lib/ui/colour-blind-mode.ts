/**
 * REQ-0230 / SCD-4 — colour-blind mode: independent of next-themes (Light/Dark/System).
 * Persist in localStorage; html[data-colour-blind] remaps status hues + chart tokens.
 * Do not apply a CSS filter to the whole app (charts and photos would distort).
 */

export const COLOUR_BLIND_STORAGE_KEY = "colour-blind-mode";
export const COLOUR_BLIND_HTML_ATTR = "data-colour-blind";

/** Figma light palette — WCAG AA on white. */
export const CBM_STATUS_LIGHT = {
  ok: "#0072B2",
  warn: "#8F6200",
  crit: "#1F2937",
} as const;

/** Dark + colour-blind — critical is light gray so #1F2937 is not used on dark glass. */
export const CBM_STATUS_DARK = {
  ok: "#56B4E9",
  warn: "#E69F00",
  crit: "#E5E7EB",
} as const;

export const CATALOG_STOCK_PIE_COLORS_DEFAULT = [
  "#10b981",
  "#f59e0b",
  "#ef4444",
] as const;

export const WAREHOUSE_STOCK_PIE_COLORS_DEFAULT = [
  "#10b981",
  "#6366f1",
  "#94a3b8",
] as const;

/** Business Insights category pie (legacy Recharts defaults). */
export const CATEGORICAL_CHART_COLORS_DEFAULT = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
] as const;

/** Okabe–Ito-style categorical set — avoids teal/orange deuteranopia collapse. */
export const CATEGORICAL_CHART_COLORS_CBM = [
  "#0072B2",
  "#E69F00",
  "#56B4E9",
  "#6B7280",
  "#7C3AED",
] as const;

export const WAREHOUSE_SHARE_PIE_COLORS_DEFAULT = [
  "#06b6d4",
  "#0ea5e9",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
] as const;

export type StatusCbmKind = "ok" | "warn" | "crit";

export type ColourBlindChartOptions = {
  colourBlind: boolean;
  dark: boolean;
};

export function parseColourBlindStorage(raw: string | null): boolean {
  return raw === "true";
}

export function readColourBlindMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return parseColourBlindStorage(
      window.localStorage.getItem(COLOUR_BLIND_STORAGE_KEY),
    );
  } catch {
    return false;
  }
}

export function writeColourBlindMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      COLOUR_BLIND_STORAGE_KEY,
      enabled ? "true" : "false",
    );
  } catch {
    /* quota / private mode */
  }
}

export function applyColourBlindHtml(enabled: boolean): void {
  if (typeof document === "undefined") return;
  if (enabled) {
    document.documentElement.setAttribute(COLOUR_BLIND_HTML_ATTR, "true");
  } else {
    document.documentElement.removeAttribute(COLOUR_BLIND_HTML_ATTR);
  }
}

const colourBlindListeners = new Set<() => void>();

function emitColourBlindMode(): void {
  colourBlindListeners.forEach((listener) => listener());
}

export function subscribeColourBlindMode(onStoreChange: () => void): () => void {
  colourBlindListeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === COLOUR_BLIND_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    colourBlindListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function getColourBlindModeSnapshot(): boolean {
  return readColourBlindMode();
}

export function getColourBlindModeServerSnapshot(): boolean {
  return false;
}

export function setColourBlindModeEnabled(enabled: boolean): void {
  writeColourBlindMode(enabled);
  applyColourBlindHtml(enabled);
  emitColourBlindMode();
}

/** Blocking snippet for root layout (beforeInteractive). Keep in sync with COLOUR_BLIND_STORAGE_KEY. */
export const COLOUR_BLIND_FOUC_SCRIPT = `(function(){try{if(localStorage.getItem("${COLOUR_BLIND_STORAGE_KEY}")==="true"){document.documentElement.setAttribute("${COLOUR_BLIND_HTML_ATTR}","true");}}catch(e){}})();`;

export function statusCbmClass(
  kind: StatusCbmKind,
  solid = false,
): string {
  return solid
    ? `cbm-status-${kind} cbm-status-solid`
    : `cbm-status-${kind}`;
}

/**
 * CSS contract for glass (non-solid) CBM status pills in `app/globals.css`.
 * Tailwind glass badges keep `bg-emerald-100` / `dark:bg-emerald-950/50`. Those
 * utilities set `background-color`. A translucent `background-image` gradient
 * does not replace that fill, so remap must set `background-color` from
 * `--cbm-*` (pastel mix on light, translucent mix on dark) and clear
 * `background-image`. `color` / `border-color` use `!important` because this
 * Turbopack build emits unlayered utilities after the CBM block.
 */
export const CBM_GLASS_STATUS_FILL_CONTRACT = {
  setsBackgroundColor: true,
  clearsBackgroundImage: true,
  lightMix: "pastel-with-white",
  darkMix: "translucent-with-transparent",
  colorAndBorderUseImportant: true,
} as const;

export function cbmGlassBackgroundColor(
  kind: StatusCbmKind,
  dark: boolean,
): string {
  const token = `var(--cbm-${kind})`;
  return dark
    ? `color-mix(in srgb, ${token} 22%, transparent)`
    : `color-mix(in srgb, ${token} 18%, white)`;
}

export function statusCbmTextClass(kind: StatusCbmKind): string {
  return `cbm-status-text-${kind}`;
}

export function cbmStatusHex({
  colourBlind,
  dark,
}: ColourBlindChartOptions): {
  ok: string;
  warn: string;
  crit: string;
} {
  if (!colourBlind) {
    return { ok: "#10b981", warn: "#f59e0b", crit: "#ef4444" };
  }
  return dark ? CBM_STATUS_DARK : CBM_STATUS_LIGHT;
}

export function getCatalogStockPieColors(
  options: ColourBlindChartOptions,
): string[] {
  const { ok, warn, crit } = cbmStatusHex(options);
  if (!options.colourBlind) {
    return [...CATALOG_STOCK_PIE_COLORS_DEFAULT];
  }
  return [ok, warn, crit];
}

export function getWarehouseStockPieColors(
  options: ColourBlindChartOptions,
): string[] {
  if (!options.colourBlind) {
    return [...WAREHOUSE_STOCK_PIE_COLORS_DEFAULT];
  }
  return options.dark
    ? [CBM_STATUS_DARK.ok, "#A78BFA", "#9CA3AF"]
    : [CBM_STATUS_LIGHT.ok, "#7C3AED", "#6B7280"];
}

export function getCategoricalChartColors(colourBlind: boolean): string[] {
  return colourBlind
    ? [...CATEGORICAL_CHART_COLORS_CBM]
    : [...CATEGORICAL_CHART_COLORS_DEFAULT];
}

export function getWarehouseSharePieColors(colourBlind: boolean): string[] {
  return colourBlind
    ? [...CATEGORICAL_CHART_COLORS_CBM]
    : [...WAREHOUSE_SHARE_PIE_COLORS_DEFAULT];
}
