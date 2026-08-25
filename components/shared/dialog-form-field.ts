/**
 * Dialog form control styling — glass shell + hue-matched focus ring (REQ-0046).
 * Accent per feature: product rose, category sky, supplier emerald, order violet, etc.
 */
import { glassFormFieldClasses } from "@/lib/ui/focus-ring-styles";

const DIALOG_FORM_FIELD_BASE =
  "bg-white/10 dark:bg-white/5 backdrop-blur-md text-white placeholder:text-white/40";

const roseShell = `${DIALOG_FORM_FIELD_BASE} border border-rose-400/30 dark:border-white/20 shadow-sm`;
const skyShell = `${DIALOG_FORM_FIELD_BASE} border border-sky-400/30 dark:border-white/20 shadow-sm`;
const emeraldShell = `${DIALOG_FORM_FIELD_BASE} border border-emerald-400/30 dark:border-white/20 shadow-sm`;
const violetShell = `${DIALOG_FORM_FIELD_BASE} border border-violet-400/30 dark:border-white/20 shadow-sm`;
const indigoShell = `${DIALOG_FORM_FIELD_BASE} border border-indigo-400/30 dark:border-white/20 shadow-sm`;
const amberShell = `${DIALOG_FORM_FIELD_BASE} border border-amber-400/30 dark:border-white/20 shadow-sm`;
const tealShell = `${DIALOG_FORM_FIELD_BASE} border border-teal-400/30 dark:border-white/20 shadow-sm`;
const cyanShell = `${DIALOG_FORM_FIELD_BASE} border border-cyan-400/30 dark:border-white/20 shadow-sm`;

/** Product / shared rose dialogs */
export const DIALOG_FORM_FIELD_ROSE = glassFormFieldClasses("rose", roseShell);

/** Category dialog — sky accent */
export const DIALOG_FORM_FIELD_SKY = glassFormFieldClasses("sky", skyShell);

/** Supplier dialog — emerald accent */
export const DIALOG_FORM_FIELD_EMERALD = glassFormFieldClasses("emerald", emeraldShell);

/** Order dialog — violet accent */
export const DIALOG_FORM_FIELD_VIOLET = glassFormFieldClasses("violet", violetShell);

/** Invoice dialog — indigo accent */
export const DIALOG_FORM_FIELD_INDIGO = glassFormFieldClasses("indigo", indigoShell);

/** Product review / amber dialogs */
export const DIALOG_FORM_FIELD_AMBER = glassFormFieldClasses("amber", amberShell);

/** Shipping / warehouse teal dialogs */
export const DIALOG_FORM_FIELD_TEAL = glassFormFieldClasses("teal", tealShell);

const blueShell = `${DIALOG_FORM_FIELD_BASE} border border-blue-400/30 dark:border-white/20 shadow-sm`;

/** Warehouse cyan dialogs */
export const DIALOG_FORM_FIELD_CYAN = glassFormFieldClasses("cyan", cyanShell);

/** Admin create-user — blue accent */
export const DIALOG_FORM_FIELD_BLUE = glassFormFieldClasses("blue", blueShell);

/** REQ-0126 — trailing calendar icon in dialog date fields (match Select chevron contrast). */
export const DIALOG_DATE_CALENDAR_ICON_CLASS =
  "text-white/80 hover:text-white transition-colors";

/**
 * REQ-0223 — fully hide native date indicator (opacity-0 still paints a 2nd icon on WebKit).
 * Pair with custom Lucide button + showPicker(); keep pr-10 for icon gutter.
 */
export const DIALOG_NATIVE_DATE_HIDE_INDICATOR =
  "[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none";

/**
 * REQ-0199 — Combobox trigger inside dark dialogs (Popover + Command).
 * Use with Button `variant="ghost"` + `DIALOG_FORM_FIELD_*` — kills outline→white hover.
 */
export const DIALOG_COMBOBOX_TRIGGER_CLASS =
  "font-normal text-white hover:bg-white/5 hover:text-white focus-visible:ring-0";
