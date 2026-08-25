"use client";

/**
 * REQ-0230 — colour-blind preference (independent of next-themes).
 * FOUC script in root layout applies html[data-colour-blind] before paint.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  getColourBlindModeServerSnapshot,
  getColourBlindModeSnapshot,
  setColourBlindModeEnabled,
  subscribeColourBlindMode,
} from "@/lib/ui/colour-blind-mode";

type ColourBlindModeContextValue = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

const ColourBlindModeContext =
  createContext<ColourBlindModeContextValue | null>(null);

export function ColourBlindModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const enabled = useSyncExternalStore(
    subscribeColourBlindMode,
    getColourBlindModeSnapshot,
    getColourBlindModeServerSnapshot,
  );

  const setEnabled = useCallback((next: boolean) => {
    setColourBlindModeEnabled(next);
  }, []);

  const value = useMemo(
    () => ({ enabled, setEnabled }),
    [enabled, setEnabled],
  );

  return (
    <ColourBlindModeContext.Provider value={value}>
      {children}
    </ColourBlindModeContext.Provider>
  );
}

export function useColourBlindMode(): boolean {
  const ctx = useContext(ColourBlindModeContext);
  return ctx?.enabled ?? false;
}

export function useColourBlindModeControls(): ColourBlindModeContextValue {
  const ctx = useContext(ColourBlindModeContext);
  if (!ctx) {
    return {
      enabled: false,
      setEnabled: () => {
        /* no provider (tests) */
      },
    };
  }
  return ctx;
}
