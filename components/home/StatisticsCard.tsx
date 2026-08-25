"use client";

/**
 * Statistics Card Component
 * Glassmorphism card component for displaying warehouse statistics
 * Supports light/dark mode with colored variants (sky, emerald, amber, rose)
 */

import React from "react";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataSlotPulse } from "@/components/shared/DataSlotPulse";
import { TYPO_STAT_VALUE, TYPO_SUBTITLE } from "@/lib/ui/typography-scale";
import { PASTEL_SURFACE } from "@/lib/ui/pastel-surface-styles";

/**
 * Color variant types for statistics cards
 */
type CardVariant =
  "sky" | "emerald" | "amber" | "rose" | "violet" | "blue" | "orange" | "teal";

/**
 * Badge data structure
 */
interface BadgeData {
  label: string;
  value: string | number | React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

/**
 * Props for StatisticsCard component
 */
interface StatisticsCardProps {
  /**
   * Card title
   */
  title: string;
  /**
   * Main value to display (string, number, or hydration-safe client format node)
   */
  value: string | number | React.ReactNode;
  /**
   * Optional description text
   */
  description?: string;
  /**
   * Icon component from lucide-react
   */
  icon: LucideIcon;
  /**
   * Color variant for the card
   */
  variant?: CardVariant;
  /**
   * Array of badges to display below the value
   */
  badges?: BadgeData[];
  /**
   * Optional className for additional styling
   */
  className?: string;
  /**
   * When true, main value shows inline pulse (title/icon/description stay visible — REQ-0021)
   */
  valueLoading?: boolean;
  /**
   * When true, badge values pulse; badge labels remain visible
   */
  badgeValuesLoading?: boolean;
  /**
   * REQ-0171 — drop min-h-[210px] + tighter icon (forecast KPIs only)
   */
  compact?: boolean;
}

function pastelCard(hue: CardVariant) {
  const surface = PASTEL_SURFACE[hue];
  return {
    border: surface.border,
    fill: surface.fill,
    shadow: surface.shadow,
    hoverBorder: surface.hoverBorder,
  };
}

const variantConfig: Record<CardVariant, ReturnType<typeof pastelCard>> = {
  sky: pastelCard("sky"),
  emerald: pastelCard("emerald"),
  amber: pastelCard("amber"),
  rose: pastelCard("rose"),
  violet: pastelCard("violet"),
  blue: pastelCard("blue"),
  orange: pastelCard("orange"),
  teal: pastelCard("teal"),
};

/**
 * StatisticsCard component
 * Displays a glassmorphism card with statistics, icon, and badges
 */
export function StatisticsCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "sky",
  badges = [],
  className,
  valueLoading = false,
  badgeValuesLoading = false,
  compact = false,
}: StatisticsCardProps) {
  const config = variantConfig[variant];
  const displayValue = valueLoading ? (
    <DataSlotPulse variant="metric" />
  ) : (
    value
  );

  return (
    <article
      className={cn(
        "group rounded-[28px] border h-full flex flex-col p-2 sm:p-4 transition min-w-0",
        // REQ-0171 — compact omits tall min-height (forecast KPIs)
        !compact && "min-h-[210px]",
        compact ? "overflow-hidden" : "overflow-visible",
        config.border,
        config.fill,
        config.shadow,
        config.hoverBorder,
        className,
      )}
    >
      <div className="flex flex-1 flex-col min-h-0 min-w-0 w-full overflow-visible">
        {/* Title and icon inline so badges get full width below */}
        <div className="flex items-center justify-between gap-2 shrink-0 min-w-0">
          <p
            className={cn(
              "text-xs uppercase text-gray-700 dark:text-white/80 min-w-0 flex-1",
              compact
                ? "tracking-[0.2em] leading-snug overflow-hidden break-words"
                : "tracking-[0.45em]",
            )}
          >
            {title}
          </p>
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-xl border border-gray-300/30 bg-gray-100/50 shadow-inner shadow-primary/30 backdrop-blur dark:border-white/15 dark:bg-white/10",
              compact ? "h-8 w-8" : "h-10 w-10",
            )}
          >
            <Icon
              className={cn(
                "text-gray-700 dark:text-white",
                compact ? "h-4 w-4" : "h-5 w-5",
              )}
            />
          </div>
        </div>
        <p className={TYPO_STAT_VALUE}>{displayValue}</p>
        {description && (
          <p className={cn("mt-2", TYPO_SUBTITLE)}>{description}</p>
        )}
        {badges.length > 0 && (
          <div className="mt-3 flex w-full min-w-0 flex-wrap gap-2 overflow-visible">
            {/* REQ-0080 — neutral sub-badges; glass counters are section-title only (SectionCountBadge) */}
            {badges.map((badge, index) => (
              <Badge
                key={index}
                variant={badge.variant || "outline"}
                className="text-xs border-gray-300/50 bg-gray-100/80 text-gray-700 backdrop-blur-md shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/80"
              >
                <span className="font-normal">{badge.label}:</span>{" "}
                <span className="ml-1">
                  {badgeValuesLoading ? (
                    <DataSlotPulse variant="badge" />
                  ) : (
                    badge.value
                  )}
                </span>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
