/**
 * REQ-0047 — glass CTA / toolbar buttons (shadow glow + hue focus ring + icon hover).
 * Builds on focus-ring-styles.ts; rings use box-shadow only (no layout shift).
 */
import {
  FOCUS_NO_LAYOUT_SHIFT_CLASS,
  GLASS_FOCUS_RING,
  type GlassFocusHue,
} from "@/lib/ui/focus-ring-styles";
import { cn } from "@/lib/utils";
import {
  PASTEL_PRIMARY,
  PASTEL_SOFT,
  PASTEL_SURFACE,
} from "@/lib/ui/pastel-surface-styles";

/** Parent must include `group` — scales child svg on hover. */
export const GLASS_BUTTON_ICON_HOVER =
  "group [&_svg]:transition-transform [&_svg]:duration-200 group-hover:[&_svg]:scale-110";

/** Strips shadcn Button default shadow bleed; do NOT use bg-transparent — it kills PASTEL_PRIMARY fills via tailwind-merge */
export const GLASS_BUTTON_SHELL_RESET = "shadow-none hover:shadow-none";

/** Faded disabled submit/toolbar state */
export const GLASS_BUTTON_DISABLED =
  "disabled:opacity-50 disabled:cursor-not-allowed";

const PRIMARY_LAYOUT =
  "h-11 inline-flex items-center justify-center rounded-xl transition duration-200 font-normal shadow-sm";

const ACTION_LAYOUT =
  "inline-flex items-center justify-center rounded-xl transition duration-200 font-normal shadow-sm";

/** Cancel / reset — muted gray (dialog footers). */
export const GLASS_GHOST_BUTTON = `${FOCUS_NO_LAYOUT_SHIFT_CLASS} focus-visible:ring-2 focus-visible:ring-ring/50 dark:focus-visible:ring-white/35 h-11 inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 ${PASTEL_SOFT.gray} transition duration-200`;

/**
 * REQ-0167 — compact "Write review" under order-line price (h-8).
 */
export const GLASS_COMPACT_AMBER_BUTTON = `${FOCUS_NO_LAYOUT_SHIFT_CLASS} ${GLASS_FOCUS_RING.amber} ${GLASS_BUTTON_ICON_HOVER} h-8 inline-flex items-center justify-center gap-1 rounded-lg px-2.5 text-xs font-normal border ${PASTEL_SURFACE.amber.border} ${PASTEL_SOFT.amber} transition duration-200`;

function primaryShell(hue: GlassFocusHue): string {
  return `${PRIMARY_LAYOUT} border ${PASTEL_SURFACE[hue].border} ${PASTEL_PRIMARY[hue]}`;
}

function actionShell(hue: GlassFocusHue): string {
  return `${ACTION_LAYOUT} border ${PASTEL_SURFACE[hue].border} ${PASTEL_SOFT[hue]}`;
}

function withFocusRing(shell: string, hue: GlassFocusHue): string {
  return `${FOCUS_NO_LAYOUT_SHIFT_CLASS} ${GLASS_FOCUS_RING[hue]} ${shell}`;
}

/** Strong CTA — dialog submit, checkout. */
export const GLASS_PRIMARY_BUTTON: Record<GlassFocusHue, string> = {
  sky: withFocusRing(primaryShell("sky"), "sky"),
  rose: withFocusRing(primaryShell("rose"), "rose"),
  emerald: withFocusRing(primaryShell("emerald"), "emerald"),
  violet: withFocusRing(primaryShell("violet"), "violet"),
  indigo: withFocusRing(primaryShell("indigo"), "indigo"),
  amber: withFocusRing(primaryShell("amber"), "amber"),
  teal: withFocusRing(primaryShell("teal"), "teal"),
  cyan: withFocusRing(primaryShell("cyan"), "cyan"),
  blue: withFocusRing(primaryShell("blue"), "blue"),
};

/** Toolbar — refresh, export, save. */
export const GLASS_ACTION_BUTTON: Record<GlassFocusHue, string> = {
  sky: withFocusRing(actionShell("sky"), "sky"),
  rose: withFocusRing(actionShell("rose"), "rose"),
  emerald: withFocusRing(actionShell("emerald"), "emerald"),
  violet: withFocusRing(actionShell("violet"), "violet"),
  indigo: withFocusRing(actionShell("indigo"), "indigo"),
  amber: withFocusRing(actionShell("amber"), "amber"),
  teal: withFocusRing(actionShell("teal"), "teal"),
  cyan: withFocusRing(actionShell("cyan"), "cyan"),
  blue: withFocusRing(actionShell("blue"), "blue"),
};

export function glassPrimaryButtonClass(hue: GlassFocusHue): string {
  return GLASS_PRIMARY_BUTTON[hue];
}

export function glassActionButtonClass(hue: GlassFocusHue): string {
  return GLASS_ACTION_BUTTON[hue];
}

/** Detail page footer CTA — omit variant="ghost"; readable contrast on light backgrounds (REQ-0071). */
export function glassDetailFooterButtonClass(
  hue: GlassFocusHue,
  extra?: string,
): string {
  return cn(
    GLASS_BUTTON_ICON_HOVER,
    GLASS_BUTTON_SHELL_RESET,
    GLASS_BUTTON_DISABLED,
    "group w-full sm:w-auto gap-2",
    GLASS_PRIMARY_BUTTON[hue],
    extra,
  );
}

/** Detail page footer Back — white text parity with Edit/Duplicate CTAs (REQ-0077). */
export function glassDetailBackButtonClass(extra?: string): string {
  return cn(
    GLASS_BUTTON_ICON_HOVER,
    GLASS_BUTTON_SHELL_RESET,
    GLASS_BUTTON_DISABLED,
    "group w-full sm:w-auto gap-2",
    GLASS_PRIMARY_BUTTON.sky,
    extra,
  );
}

/**
 * Icon-only back in PageSectionHeader leading slot (all detail pages).
 * REQ-0148 — light gray border + gray-100/200 wash; icon gray-600/700 light, white/80 dark.
 * Pair with Button variant="ghost" (default Button paints bg-primary / red over this token).
 */
export const DETAIL_HEADER_BACK_ICON_CLASS =
  "h-10 w-10 shrink-0 self-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-stone-800 text-gray-600 hover:text-gray-700 dark:text-white/80 dark:hover:text-white/90 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-200 dark:hover:bg-stone-700";
