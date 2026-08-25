/** Glass tokens for auth login/register pages (REQ-0032, REQ-0033). */

import type { AuthListHue } from "@/lib/auth/auth-panel-copy";
import {
  FOCUS_NO_LAYOUT_SHIFT_CLASS,
  GLASS_FOCUS_RING,
  glassFormFieldClasses,
} from "@/lib/ui/focus-ring-styles";
import { PASTEL_PRIMARY, PASTEL_SURFACE } from "@/lib/ui/pastel-surface-styles";

export type AuthGlassVariant = "login" | "register";

/** Right form card — navbar-intensity frosted glass. */
export const AUTH_FORM_GLASS: Record<AuthGlassVariant, string> = {
  login: `border ${PASTEL_SURFACE.sky.border} ${PASTEL_SURFACE.sky.fill} ${PASTEL_SURFACE.sky.shadow} transition-all duration-300 ${PASTEL_SURFACE.sky.hoverBorder}`,
  register: `border ${PASTEL_SURFACE.emerald.border} ${PASTEL_SURFACE.emerald.fill} ${PASTEL_SURFACE.emerald.shadow} transition-all duration-300 ${PASTEL_SURFACE.emerald.hoverBorder}`,
};

/** Per-row micro-glass on flat left list (not a parent card). REQ-0033: py-2 for tighter rhythm. */
export const AUTH_LIST_ROW_GLASS =
  "rounded-2xl border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/5 backdrop-blur-md px-4 py-2";

/**
 * REQ-0033 — icon pill glass glow (matches AuthBrandHeader rose box + GLASS_BADGE_CLASS pattern).
 * Applied on login + register list rows in AuthInfoListItem.
 */
export const AUTH_LIST_ICON_GLASS: Record<AuthListHue, string> = {
  sky: `border ${PASTEL_SURFACE.sky.border} ${PASTEL_SURFACE.sky.fill} ${PASTEL_SURFACE.sky.shadow}`,
  emerald: `border ${PASTEL_SURFACE.emerald.border} ${PASTEL_SURFACE.emerald.fill} ${PASTEL_SURFACE.emerald.shadow}`,
  amber: `border ${PASTEL_SURFACE.amber.border} ${PASTEL_SURFACE.amber.fill} ${PASTEL_SURFACE.amber.shadow}`,
  violet: `border ${PASTEL_SURFACE.violet.border} ${PASTEL_SURFACE.violet.fill} ${PASTEL_SURFACE.violet.shadow}`,
  blue: `border ${PASTEL_SURFACE.blue.border} ${PASTEL_SURFACE.blue.fill} ${PASTEL_SURFACE.blue.shadow}`,
};

/**
 * REQ-0048 — auth form controls (light-mode readable on pale glass card).
 * Do not reuse DIALOG_FORM_FIELD_* — those assume dark modal shell.
 */
const AUTH_FORM_FIELD_BASE =
  "bg-white/70 dark:bg-white/5 backdrop-blur-md text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40";

const authSkyShell = `${AUTH_FORM_FIELD_BASE} border border-sky-400/30 dark:border-white/20 shadow-sm`;
const authEmeraldShell = `${AUTH_FORM_FIELD_BASE} border border-emerald-400/30 dark:border-white/20 shadow-sm`;

/** Login page inputs + role Select trigger */
export const AUTH_FORM_FIELD_SKY = glassFormFieldClasses("sky", authSkyShell);

/** Register page inputs */
export const AUTH_FORM_FIELD_EMERALD = glassFormFieldClasses(
  "emerald",
  authEmeraldShell,
);

/** Google OAuth — soft opaque fill in light mode (not bg-white/10 on pale card) */
export const AUTH_GOOGLE_BUTTON: Record<AuthGlassVariant, string> = {
  login:
    "w-full border-sky-400/40 dark:border-white/20 bg-white/80 dark:bg-white/5 backdrop-blur-md text-gray-700 dark:text-white shadow-sm hover:bg-white dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white",
  register:
    "w-full border-emerald-400/40 dark:border-white/20 bg-white/80 dark:bg-white/5 backdrop-blur-md text-gray-700 dark:text-white shadow-sm hover:bg-white dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white",
};

const AUTH_SUBMIT_LAYOUT =
  "h-11 w-full inline-flex items-center justify-center rounded-xl transition duration-200 font-normal";

export const AUTH_SUBMIT_BUTTON_EMERALD = `${FOCUS_NO_LAYOUT_SHIFT_CLASS} ${GLASS_FOCUS_RING.emerald} ${AUTH_SUBMIT_LAYOUT} border ${PASTEL_SURFACE.emerald.border} ${PASTEL_PRIMARY.emerald}`;
