/**
 * REQ-0096 / REQ-0228 — shared card shell + body padding token.
 * shell: article border/fill/shadow only (detail pages wrap children in GlassCardBody).
 * body: article includes p-2 sm:p-4 (order detail cards without inner wrapper).
 */

import React from "react";
import { cn } from "@/lib/utils";
import { PASTEL_SURFACE, type PastelHue } from "@/lib/ui/pastel-surface-styles";

export type GlassCardVariant =
  | "sky"
  | "emerald"
  | "amber"
  | "violet"
  | "blue"
  | "orange"
  | "teal"
  | "rose"
  | "cyan";

/** @deprecated Use GlassCardVariant — kept for order-detail barrel compat */
export type CardVariant = GlassCardVariant;

export const GLASS_CARD_VARIANT_CONFIG: Record<
  GlassCardVariant,
  {
    border: string;
    gradient: string;
    shadow: string;
    hoverBorder: string;
    iconBg: string;
  }
> = Object.fromEntries(
  (
    [
      "sky",
      "emerald",
      "amber",
      "violet",
      "blue",
      "orange",
      "teal",
      "rose",
      "cyan",
    ] as const
  ).map((hue: PastelHue) => {
    const surface = PASTEL_SURFACE[hue];
    return [
      hue,
      {
        border: surface.border,
        gradient: surface.fill,
        shadow: surface.shadow,
        hoverBorder: surface.hoverBorder,
        iconBg: `${surface.border} ${surface.fill}`,
      },
    ];
  }),
) as Record<
  GlassCardVariant,
  {
    border: string;
    gradient: string;
    shadow: string;
    hoverBorder: string;
    iconBg: string;
  }
>;

/** @deprecated Use GLASS_CARD_VARIANT_CONFIG */
export const variantConfig = GLASS_CARD_VARIANT_CONFIG;

export type GlassCardProps = {
  children: React.ReactNode;
  variant?: GlassCardVariant;
  className?: string;
  /** shell = no article padding; body = p-2 sm:p-4 on article */
  padding?: "shell" | "body";
};

export function GlassCard({
  children,
  variant = "blue",
  className,
  padding = "shell",
}: GlassCardProps) {
  const config = GLASS_CARD_VARIANT_CONFIG[variant];
  return (
    <article
      className={cn(
        "group rounded-[20px] border transition-all duration-300 overflow-hidden",
        padding === "body" && "p-2 sm:p-4 bg-white/80 dark:bg-stone-900/60",
        config.border,
        config.gradient,
        config.shadow,
        config.hoverBorder,
        className,
      )}
    >
      {children}
    </article>
  );
}

/** Canonical inner padding for shell-mode GlassCard (REQ-0095). */
export function GlassCardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-2 sm:p-4", className)}>{children}</div>;
}
