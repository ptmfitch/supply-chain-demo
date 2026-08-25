import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";
import { SectionCardHeader } from "@/components/shared/SectionCardHeader";
import type { SectionHeaderTone } from "@/lib/ui/section-header-tones";

/**
 * Color variant types for chart cards
 */
type CardVariant =
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "blue"
  | "orange"
  | "teal"
  | "neutral";

interface ChartCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  description?: string;
  variant?: CardVariant;
}

/**
 * Color configuration for each variant - glassmorphic style
 */
const variantConfig: Record<
  CardVariant,
  {
    border: string;
    gradient: string;
    shadow: string;
    hoverBorder: string;
  }
> = {
  sky: {
    border: "border-sky-400/20",
    gradient: "bg-sky-100 dark:bg-sky-950/45",
    shadow: "shadow-sm",
    hoverBorder: "hover:border-sky-300/40",
  },
  emerald: {
    border: "border-emerald-400/20",
    gradient: "bg-emerald-100 dark:bg-emerald-950/45",
    shadow: "shadow-sm",
    hoverBorder: "hover:border-emerald-300/40",
  },
  amber: {
    border: "border-amber-400/20",
    gradient: "bg-amber-100 dark:bg-amber-950/45",
    shadow: "shadow-sm",
    hoverBorder: "hover:border-amber-300/40",
  },
  rose: {
    border: "border-rose-400/20",
    gradient: "bg-rose-100 dark:bg-rose-950/45",
    shadow: "shadow-sm",
    hoverBorder: "hover:border-rose-300/40",
  },
  violet: {
    border: "border-violet-400/20",
    gradient: "bg-violet-100 dark:bg-violet-950/45",
    shadow: "shadow-sm",
    hoverBorder: "hover:border-violet-300/40",
  },
  blue: {
    border: "border-blue-400/20",
    gradient: "bg-blue-100 dark:bg-blue-950/45",
    shadow: "shadow-sm",
    hoverBorder: "hover:border-blue-300/40",
  },
  orange: {
    border: "border-orange-400/20",
    gradient: "bg-orange-100 dark:bg-orange-950/45",
    shadow: "shadow-sm",
    hoverBorder: "hover:border-orange-300/40",
  },
  teal: {
    border: "border-teal-400/20",
    gradient: "bg-teal-100 dark:bg-teal-950/45",
    shadow: "shadow-sm",
    hoverBorder: "hover:border-teal-300/40",
  },
  neutral: {
    border: "border-gray-300/30 dark:border-white/10",
    gradient: "bg-gray-100 dark:bg-gray-950/45",
    shadow: "shadow-sm",
    hoverBorder: "hover:border-gray-300/50 dark:hover:border-white/20",
  },
};

export function ChartCard({
  title,
  icon: Icon,
  children,
  className,
  description,
  variant = "neutral",
}: ChartCardProps) {
  const config = variantConfig[variant];

  return (
    <article
      className={cn(
        "group rounded-[20px] border backdrop-blur-md transition",
        config.border,
        config.gradient,
        config.shadow,
        config.hoverBorder,
        className,
      )}
    >
      <div className="px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
        <SectionCardHeader
          title={title}
          description={description}
          icon={Icon}
          tone={variant as SectionHeaderTone}
        />
      </div>
      <div className="overflow-visible px-4 pb-4 sm:px-5 sm:pb-5 pt-1">
        {children}
      </div>
    </article>
  );
}
