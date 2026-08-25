/**
 * Floating action buttons — REQ-0228 muted pastel fills.
 */
import { cn } from "@/lib/utils";
import type { GlassFocusHue } from "@/lib/ui/focus-ring-styles";
import { PASTEL_PRIMARY, PASTEL_SURFACE } from "@/lib/ui/pastel-surface-styles";

const FAB_BASE =
  "h-14 rounded-full flex items-center justify-center gap-2 font-normal transition-all duration-300 shadow-sm";

export function fabButtonClass(hue: GlassFocusHue, expanded: boolean): string {
  return cn(
    FAB_BASE,
    "border",
    PASTEL_SURFACE[hue].border,
    PASTEL_PRIMARY[hue],
    expanded ? "w-auto px-4" : "w-14 px-0",
  );
}
