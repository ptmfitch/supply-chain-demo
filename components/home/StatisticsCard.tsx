"use client";

/**
 * Statistics Card Component
 * Glassmorphism card component for displaying warehouse statistics
 * Supports light/dark mode with colored variants (sky, emerald, amber, rose)
 */

import React, { useLayoutEffect, useRef } from "react";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataSlotPulse } from "@/components/shared/DataSlotPulse";
import { TYPO_STAT_VALUE, TYPO_SUBTITLE } from "@/lib/ui/typography-scale";
import { PASTEL_SURFACE } from "@/lib/ui/pastel-surface-styles";
import { writeAgentDebugLog } from "@/lib/debug/write-agent-log";

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
  const cardRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const displayValue = valueLoading ? (
    <DataSlotPulse variant="metric" />
  ) : (
    value
  );

  // #region agent log
  useLayoutEffect(() => {
    if (!compact) return;
    const card = cardRef.current;
    const titleEl = titleRef.current;
    const row = rowRef.current;
    const icon = iconRef.current;
    if (!card || !titleEl) return;
    const titleCs = getComputedStyle(titleEl);
    const cardRect = card.getBoundingClientRect();
    const titleRect = titleEl.getBoundingClientRect();
    const rowRect = row?.getBoundingClientRect();
    const iconRect = icon?.getBoundingClientRect();
    const parentArticle = card.parentElement?.closest("article");
    const overflowScroll = titleEl.scrollWidth > titleEl.clientWidth + 1;
    const overflowRect = titleRect.right > cardRect.right + 1;
    const rowOverflow = Boolean(rowRect && rowRect.right > cardRect.right + 1);
    void writeAgentDebugLog({
      hypothesisId: "A",
      location: "StatisticsCard.tsx:compact-title",
      message: "compact KPI title overflow probe",
      runId: "post-fix",
      data: {
        title,
        viewportW: window.innerWidth,
        cardW: Math.round(cardRect.width),
        cardPadX: Math.round(cardRect.width - titleEl.clientWidth - (iconRect?.width ?? 0)),
        titleClientW: titleEl.clientWidth,
        titleScrollW: titleEl.scrollWidth,
        titleH: Math.round(titleRect.height),
        overflowScroll,
        overflowRect,
        rowOverflow,
        rowW: rowRect ? Math.round(rowRect.width) : null,
        rowMinWidth: row ? getComputedStyle(row).minWidth : null,
        iconW: iconRect ? Math.round(iconRect.width) : null,
        letterSpacing: titleCs.letterSpacing,
        whiteSpace: titleCs.whiteSpace,
        overflowX: titleCs.overflowX,
        overflowWrap: titleCs.overflowWrap,
        cardOverflow: getComputedStyle(card).overflow,
        parentArticleW: parentArticle
          ? Math.round(parentArticle.getBoundingClientRect().width)
          : null,
      },
    });
  }, [compact, title]);
  // #endregion

  return (
    <article
      ref={cardRef}
      data-debug-compact-kpi={compact ? title : undefined}
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
        <div
          ref={rowRef}
          className="flex items-center justify-between gap-2 shrink-0 min-w-0"
        >
          <p
            ref={titleRef}
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
            ref={iconRef}
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
