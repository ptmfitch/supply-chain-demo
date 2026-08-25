import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataSlotPulse } from "@/components/shared/DataSlotPulse";
import {
  GlassCard as SharedGlassCard,
  GLASS_CARD_VARIANT_CONFIG,
  type GlassCardVariant,
} from "@/lib/ui/glass-card";

export type CardVariant = GlassCardVariant;
export const variantConfig = GLASS_CARD_VARIANT_CONFIG;

/** Order detail cards use body padding on article (no inner GlassCardBody). */
export function GlassCard({
  children,
  variant = "blue",
  className,
}: {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}) {
  return (
    <SharedGlassCard variant={variant} className={className} padding="body">
      {children}
    </SharedGlassCard>
  );
}

export function formatAddress(address: unknown): string {
  if (!address || typeof address !== "object") return "N/A";
  const addr = address as Record<string, unknown>;
  const parts: string[] = [];
  if (addr.street) parts.push(String(addr.street));
  if (addr.city) parts.push(String(addr.city));
  if (addr.state) parts.push(String(addr.state));
  if (addr.zipCode) parts.push(String(addr.zipCode));
  if (addr.country) parts.push(String(addr.country));
  return parts.length > 0 ? parts.join(", ") : "N/A";
}

export function getCustomerDisplay(order: {
  shippingAddress?: unknown;
  placedByName?: string | null;
}): string {
  const addr = order.shippingAddress as
    | { name?: string; email?: string }
    | null
    | undefined;
  if (addr?.name) return addr.name;
  if (addr?.email) return addr.email;
  if (order.placedByName) return order.placedByName;
  return "—";
}

export function getCustomerEmail(order: {
  shippingAddress?: unknown;
  placedByEmail?: string | null;
}): string {
  const addr = order.shippingAddress as { email?: string } | null | undefined;
  if (addr?.email) return addr.email;
  if (order.placedByEmail) return order.placedByEmail;
  return "—";
}

type DetailInfoTone = CardVariant;

const detailInfoToneClasses: Record<
  DetailInfoTone,
  { icon: string; row: string }
> = {
  orange: {
    icon: "text-orange-500 dark:text-orange-400",
    row: "bg-orange-100 dark:bg-orange-950/45 border-orange-200/30 dark:border-orange-400/10",
  },
  amber: {
    icon: "text-amber-500 dark:text-amber-400",
    row: "bg-amber-100 dark:bg-amber-950/45 border-amber-200/30 dark:border-amber-400/10",
  },
  sky: {
    icon: "text-sky-500 dark:text-sky-400",
    row: "bg-sky-100 dark:bg-sky-950/45 border-sky-200/30 dark:border-sky-400/10",
  },
  emerald: {
    icon: "text-emerald-500 dark:text-emerald-400",
    row: "bg-emerald-100 dark:bg-emerald-950/45 border-emerald-200/30 dark:border-emerald-400/10",
  },
  violet: {
    icon: "text-violet-500 dark:text-violet-400",
    row: "bg-violet-100 dark:bg-violet-950/45 border-violet-200/30 dark:border-violet-400/10",
  },
  blue: {
    icon: "text-sky-500 dark:text-sky-400",
    row: "bg-blue-100 dark:bg-blue-950/45 border-blue-200/30 dark:border-blue-400/10",
  },
  teal: {
    icon: "text-teal-500 dark:text-teal-400",
    row: "bg-teal-100 dark:bg-teal-950/45 border-teal-200/30 dark:border-teal-400/10",
  },
  rose: {
    icon: "text-rose-500 dark:text-rose-400",
    row: "bg-rose-100 dark:bg-rose-950/45 border-rose-200/30 dark:border-rose-400/10",
  },
  cyan: {
    icon: "text-cyan-500 dark:text-cyan-400",
    row: "bg-cyan-100 dark:bg-cyan-950/45 border-cyan-200/30 dark:border-cyan-400/10",
  },
};

/** REQ-0071 — icon + label + value row for detail information cards. */
export function DetailInfoRow({
  icon: Icon,
  label,
  children,
  tone = "orange",
  loading,
  valueClassName,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  tone?: DetailInfoTone;
  loading?: boolean;
  /** REQ-0114 — optional emphasis override on value span */
  valueClassName?: string;
}) {
  const styles = detailInfoToneClasses[tone];
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 text-sm p-2 rounded-xl border",
        styles.row,
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", styles.icon)} />
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      <span
        className={cn(
          "font-normal text-gray-700 dark:text-white inline-flex items-center min-w-0",
          valueClassName,
        )}
      >
        {loading ? (
          <DataSlotPulse variant="text-sm" className="w-24" />
        ) : (
          children
        )}
      </span>
    </div>
  );
}
