/**
 * REQ-0228 — muted pastel fills (no gradients, no bloom shadows).
 * Complete class strings so Tailwind JIT can see every token.
 */

export const PASTEL_PAGE_SHELL = "bg-stone-100 dark:bg-stone-950";

/** Layout wrapper on Navbar — keep the full string for Tailwind JIT. */
export const PASTEL_PAGE_SHELL_LAYOUT =
  "flex h-screen overflow-hidden relative min-h-screen bg-stone-100 dark:bg-stone-950";

export const PASTEL_FROST = "bg-white/90 dark:bg-stone-900/80";

export const PASTEL_FROST_HOVER = "hover:bg-white dark:hover:bg-stone-800/80";

export type PastelHue =
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "blue"
  | "orange"
  | "teal"
  | "cyan"
  | "indigo"
  | "gray"
  | "slate"
  | "yellow"
  | "red"
  | "purple"
  | "pink";

export type PastelSurface = {
  border: string;
  fill: string;
  hoverBorder: string;
  shadow: string;
};

const SHADOW = "shadow-sm";

export const PASTEL_SURFACE: Record<PastelHue, PastelSurface> = {
  sky: {
    border: "border-sky-200/90 dark:border-sky-800/50",
    fill: "bg-sky-100 dark:bg-sky-950/45",
    hoverBorder: "hover:border-sky-300 dark:hover:border-sky-700",
    shadow: SHADOW,
  },
  emerald: {
    border: "border-emerald-200/90 dark:border-emerald-800/50",
    fill: "bg-emerald-100 dark:bg-emerald-950/45",
    hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-700",
    shadow: SHADOW,
  },
  amber: {
    border: "border-amber-200/90 dark:border-amber-800/50",
    fill: "bg-amber-100 dark:bg-amber-950/45",
    hoverBorder: "hover:border-amber-300 dark:hover:border-amber-700",
    shadow: SHADOW,
  },
  rose: {
    border: "border-rose-200/90 dark:border-rose-800/50",
    fill: "bg-rose-100 dark:bg-rose-950/45",
    hoverBorder: "hover:border-rose-300 dark:hover:border-rose-700",
    shadow: SHADOW,
  },
  violet: {
    border: "border-violet-200/90 dark:border-violet-800/50",
    fill: "bg-violet-100 dark:bg-violet-950/45",
    hoverBorder: "hover:border-violet-300 dark:hover:border-violet-700",
    shadow: SHADOW,
  },
  blue: {
    border: "border-blue-200/90 dark:border-blue-800/50",
    fill: "bg-blue-100 dark:bg-blue-950/45",
    hoverBorder: "hover:border-blue-300 dark:hover:border-blue-700",
    shadow: SHADOW,
  },
  orange: {
    border: "border-orange-200/90 dark:border-orange-800/50",
    fill: "bg-orange-100 dark:bg-orange-950/45",
    hoverBorder: "hover:border-orange-300 dark:hover:border-orange-700",
    shadow: SHADOW,
  },
  teal: {
    border: "border-teal-200/90 dark:border-teal-800/50",
    fill: "bg-teal-100 dark:bg-teal-950/45",
    hoverBorder: "hover:border-teal-300 dark:hover:border-teal-700",
    shadow: SHADOW,
  },
  cyan: {
    border: "border-cyan-200/90 dark:border-cyan-800/50",
    fill: "bg-cyan-100 dark:bg-cyan-950/45",
    hoverBorder: "hover:border-cyan-300 dark:hover:border-cyan-700",
    shadow: SHADOW,
  },
  indigo: {
    border: "border-indigo-200/90 dark:border-indigo-800/50",
    fill: "bg-indigo-100 dark:bg-indigo-950/45",
    hoverBorder: "hover:border-indigo-300 dark:hover:border-indigo-700",
    shadow: SHADOW,
  },
  gray: {
    border: "border-gray-200/90 dark:border-gray-700/50",
    fill: "bg-gray-100 dark:bg-gray-900/50",
    hoverBorder: "hover:border-gray-300 dark:hover:border-gray-600",
    shadow: SHADOW,
  },
  slate: {
    border: "border-slate-200/90 dark:border-slate-700/50",
    fill: "bg-slate-100 dark:bg-slate-900/50",
    hoverBorder: "hover:border-slate-300 dark:hover:border-slate-600",
    shadow: SHADOW,
  },
  yellow: {
    border: "border-yellow-200/90 dark:border-yellow-800/50",
    fill: "bg-yellow-100 dark:bg-yellow-950/45",
    hoverBorder: "hover:border-yellow-300 dark:hover:border-yellow-700",
    shadow: SHADOW,
  },
  red: {
    border: "border-red-200/90 dark:border-red-800/50",
    fill: "bg-red-100 dark:bg-red-950/45",
    hoverBorder: "hover:border-red-300 dark:hover:border-red-700",
    shadow: SHADOW,
  },
  purple: {
    border: "border-purple-200/90 dark:border-purple-800/50",
    fill: "bg-purple-100 dark:bg-purple-950/45",
    hoverBorder: "hover:border-purple-300 dark:hover:border-purple-700",
    shadow: SHADOW,
  },
  pink: {
    border: "border-pink-200/90 dark:border-pink-800/50",
    fill: "bg-pink-100 dark:bg-pink-950/45",
    hoverBorder: "hover:border-pink-300 dark:hover:border-pink-700",
    shadow: SHADOW,
  },
};

/** Soft toolbar / action control fill. */
export const PASTEL_SOFT: Record<PastelHue, string> = {
  sky: "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100 hover:bg-sky-200 dark:hover:bg-sky-900/60",
  emerald:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100 hover:bg-emerald-200 dark:hover:bg-emerald-900/60",
  amber:
    "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-900/60",
  rose: "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100 hover:bg-rose-200 dark:hover:bg-rose-900/60",
  violet:
    "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-100 hover:bg-violet-200 dark:hover:bg-violet-900/60",
  blue: "bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-900/60",
  orange:
    "bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-100 hover:bg-orange-200 dark:hover:bg-orange-900/60",
  teal: "bg-teal-100 text-teal-900 dark:bg-teal-950/50 dark:text-teal-100 hover:bg-teal-200 dark:hover:bg-teal-900/60",
  cyan: "bg-cyan-100 text-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-100 hover:bg-cyan-200 dark:hover:bg-cyan-900/60",
  indigo:
    "bg-indigo-100 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100 hover:bg-indigo-200 dark:hover:bg-indigo-900/60",
  gray: "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800/70",
  slate:
    "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800/70",
  yellow:
    "bg-yellow-100 text-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-900/60",
  red: "bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-900/60",
  purple:
    "bg-purple-100 text-purple-900 dark:bg-purple-950/50 dark:text-purple-100 hover:bg-purple-200 dark:hover:bg-purple-900/60",
  pink: "bg-pink-100 text-pink-900 dark:bg-pink-950/50 dark:text-pink-100 hover:bg-pink-200 dark:hover:bg-pink-900/60",
};

/** Stronger CTA fill — still pastel, not saturated 500. */
export const PASTEL_PRIMARY: Record<PastelHue, string> = {
  sky: "bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-50 hover:bg-sky-300 dark:hover:bg-sky-700",
  emerald:
    "bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-50 hover:bg-emerald-300 dark:hover:bg-emerald-700",
  amber:
    "bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-50 hover:bg-amber-300 dark:hover:bg-amber-700",
  rose: "bg-rose-200 text-rose-900 dark:bg-rose-800 dark:text-rose-50 hover:bg-rose-300 dark:hover:bg-rose-700",
  violet:
    "bg-violet-200 text-violet-900 dark:bg-violet-800 dark:text-violet-50 hover:bg-violet-300 dark:hover:bg-violet-700",
  blue: "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-50 hover:bg-blue-300 dark:hover:bg-blue-700",
  orange:
    "bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-50 hover:bg-orange-300 dark:hover:bg-orange-700",
  teal: "bg-teal-200 text-teal-900 dark:bg-teal-800 dark:text-teal-50 hover:bg-teal-300 dark:hover:bg-teal-700",
  cyan: "bg-cyan-200 text-cyan-900 dark:bg-cyan-800 dark:text-cyan-50 hover:bg-cyan-300 dark:hover:bg-cyan-700",
  indigo:
    "bg-indigo-200 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-50 hover:bg-indigo-300 dark:hover:bg-indigo-700",
  gray: "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-50 hover:bg-gray-300 dark:hover:bg-gray-600",
  slate:
    "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-50 hover:bg-slate-300 dark:hover:bg-slate-600",
  yellow:
    "bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-50 hover:bg-yellow-300 dark:hover:bg-yellow-700",
  red: "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-50 hover:bg-red-300 dark:hover:bg-red-700",
  purple:
    "bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-50 hover:bg-purple-300 dark:hover:bg-purple-700",
  pink: "bg-pink-200 text-pink-900 dark:bg-pink-800 dark:text-pink-50 hover:bg-pink-300 dark:hover:bg-pink-700",
};
