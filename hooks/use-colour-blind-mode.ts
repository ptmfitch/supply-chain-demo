"use client";

import { useTheme } from "next-themes";
import type { ColourBlindChartOptions } from "@/lib/ui/colour-blind-mode";
import {
  useColourBlindMode,
  useColourBlindModeControls,
} from "@/components/providers/ColourBlindModeProvider";

export { useColourBlindMode, useColourBlindModeControls };

export function useColourBlindChartOptions(): ColourBlindChartOptions {
  const colourBlind = useColourBlindMode();
  const { resolvedTheme } = useTheme();
  return { colourBlind, dark: resolvedTheme === "dark" };
}
