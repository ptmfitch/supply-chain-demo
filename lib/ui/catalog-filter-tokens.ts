/**
 * REQ-0041 / REQ-0046 — shared hue tokens for catalog status filters and export menus.
 * Category (sky), supplier (emerald), warehouse (cyan); export violet/teal.
 */
import type { LucideIcon } from "lucide-react";
import { FolderTree, Truck, Warehouse } from "lucide-react";
import {
  FOCUS_NO_LAYOUT_SHIFT_CLASS,
  GLASS_FOCUS_RING,
  type GlassFocusHue,
} from "@/lib/ui/focus-ring-styles";
import {
  catalogEntityPopoverContentClass,
  exportMenuPopoverContentClass,
  READABLE_POPOVER_ITEM_CLASS,
} from "@/lib/ui/popover-readability-styles";

export type CatalogEntity = "category" | "supplier" | "warehouse";

export type CatalogStatusFilter = "all" | "active" | "inactive";

export type ExportAccent = "violet" | "teal";

/** REQ-0046 — filter + export toolbar triggers share px/gap/width rhythm. */
export const CATALOG_TOOLBAR_TRIGGER_LAYOUT = `${FOCUS_NO_LAYOUT_SHIFT_CLASS} h-10 w-full sm:w-auto px-4 gap-2 font-normal flex items-center`;

/** DeferredSelectGate placeholder — matches trigger + chevron slot. */
export const CATALOG_TOOLBAR_PLACEHOLDER_LAYOUT =
  "h-10 w-full sm:w-auto px-4 gap-2 font-normal flex items-center justify-between text-sm";

const CATEGORY_HUE =
  "border border-sky-400/30 dark:border-sky-400/30 bg-sky-100 dark:bg-sky-950/45 text-gray-700 dark:text-white shadow-sm backdrop-blur-md transition duration-200 hover:border-sky-300/40 hover:bg-sky-200 dark:hover:bg-sky-900/50 dark:hover:border-sky-300/40 hover:bg-sky-200 dark:hover:bg-sky-900/50";

const SUPPLIER_HUE =
  "border border-emerald-400/30 dark:border-emerald-400/30 bg-emerald-100 dark:bg-emerald-950/45 text-gray-700 dark:text-white shadow-sm backdrop-blur-md transition duration-200 hover:border-emerald-300/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 dark:hover:border-emerald-300/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/50";

const WAREHOUSE_HUE =
  "border border-cyan-400/30 dark:border-cyan-400/30 bg-cyan-100 dark:bg-cyan-950/45 text-gray-700 dark:text-white shadow-sm backdrop-blur-md transition duration-200 hover:border-cyan-300/40 hover:bg-cyan-200 dark:hover:bg-cyan-900/50 dark:hover:border-cyan-300/40 hover:bg-cyan-200 dark:hover:bg-cyan-900/50";

function catalogSelectTriggerClass(
  hue: string,
  focusHue: GlassFocusHue,
): string {
  return `${CATALOG_TOOLBAR_TRIGGER_LAYOUT} ${GLASS_FOCUS_RING[focusHue]} rounded-[28px] ${hue}`;
}

function catalogSelectPlaceholderClass(hue: string): string {
  return `${CATALOG_TOOLBAR_PLACEHOLDER_LAYOUT} rounded-[28px] ${hue}`;
}

export const CATALOG_ENTITY_META: Record<
  CatalogEntity,
  {
    allLabel: string;
    icon: LucideIcon;
    selectTriggerClass: string;
    selectPlaceholderClass: string;
    selectContentClass: string;
    selectItemClass: string;
  }
> = {
  category: {
    allLabel: "All Categories",
    icon: FolderTree,
    selectTriggerClass: catalogSelectTriggerClass(CATEGORY_HUE, "sky"),
    selectPlaceholderClass: catalogSelectPlaceholderClass(CATEGORY_HUE),
    selectContentClass: catalogEntityPopoverContentClass("category"),
    selectItemClass: READABLE_POPOVER_ITEM_CLASS,
  },
  supplier: {
    allLabel: "All Suppliers",
    icon: Truck,
    selectTriggerClass: catalogSelectTriggerClass(SUPPLIER_HUE, "emerald"),
    selectPlaceholderClass: catalogSelectPlaceholderClass(SUPPLIER_HUE),
    selectContentClass: catalogEntityPopoverContentClass("supplier"),
    selectItemClass: READABLE_POPOVER_ITEM_CLASS,
  },
  warehouse: {
    allLabel: "All Warehouses",
    icon: Warehouse,
    selectTriggerClass: catalogSelectTriggerClass(WAREHOUSE_HUE, "cyan"),
    selectPlaceholderClass: catalogSelectPlaceholderClass(WAREHOUSE_HUE),
    selectContentClass: catalogEntityPopoverContentClass("warehouse"),
    selectItemClass: READABLE_POPOVER_ITEM_CLASS,
  },
};

const VIOLET_EXPORT_HUE =
  "border border-violet-400/30 dark:border-violet-400/30 bg-violet-100 dark:bg-violet-950/45 text-gray-700 dark:text-white shadow-sm backdrop-blur-md transition duration-200 hover:border-violet-300/40 hover:bg-violet-200 dark:hover:bg-violet-900/50 dark:hover:border-violet-300/40 hover:bg-violet-200 dark:hover:bg-violet-900/50";

const TEAL_EXPORT_HUE =
  "border border-teal-400/30 dark:border-teal-400/30 bg-teal-100 dark:bg-teal-950/45 text-gray-700 dark:text-white shadow-sm backdrop-blur-md transition duration-200 hover:border-teal-300/40 hover:bg-teal-200 dark:hover:bg-teal-900/50 dark:hover:border-teal-300/40 hover:bg-teal-200 dark:hover:bg-teal-900/50";

function exportTriggerClass(hue: string, focusHue: GlassFocusHue): string {
  return `group ${CATALOG_TOOLBAR_TRIGGER_LAYOUT} ${GLASS_FOCUS_RING[focusHue]} rounded-[28px] ${hue}`;
}

export const EXPORT_MENU_STYLES: Record<
  ExportAccent,
  { triggerClass: string; contentClass: string; itemFocusClass: string }
> = {
  violet: {
    triggerClass: exportTriggerClass(VIOLET_EXPORT_HUE, "violet"),
    contentClass: exportMenuPopoverContentClass("violet"),
    itemFocusClass: READABLE_POPOVER_ITEM_CLASS,
  },
  teal: {
    triggerClass: exportTriggerClass(TEAL_EXPORT_HUE, "teal"),
    contentClass: exportMenuPopoverContentClass("teal"),
    itemFocusClass: READABLE_POPOVER_ITEM_CLASS,
  },
};
