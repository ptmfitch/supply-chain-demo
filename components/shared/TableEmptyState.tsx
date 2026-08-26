"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GLASS_BUTTON_ICON_HOVER,
  GLASS_BUTTON_SHELL_RESET,
  GLASS_GHOST_BUTTON,
  GLASS_PRIMARY_BUTTON,
} from "@/lib/ui/glass-button-styles";
import { TYPO_CARD_TITLE, TYPO_SUBTITLE } from "@/lib/ui/typography-scale";
import { cn } from "@/lib/utils";

type TableEmptyStateAction =
  | {
      label: string;
      onClick: () => void;
      href?: never;
    }
  | {
      label: string;
      href: string;
      onClick?: never;
    };

export type TableEmptyStateProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  action: TableEmptyStateAction;
  actionVariant?: "primary" | "outline";
};

export function TableEmptyState({
  title,
  description,
  icon: Icon,
  action,
  actionVariant = "primary",
}: TableEmptyStateProps) {
  const actionClassName = cn(
    GLASS_BUTTON_ICON_HOVER,
    GLASS_BUTTON_SHELL_RESET,
    "group h-9 gap-2 px-4",
    actionVariant === "primary"
      ? GLASS_PRIMARY_BUTTON.sky
      : GLASS_GHOST_BUTTON,
  );

  const actionButton =
    action.href !== undefined ? (
      <Button asChild variant="ghost" className={actionClassName}>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    ) : (
      <Button
        type="button"
        variant="ghost"
        className={actionClassName}
        onClick={action.onClick}
      >
        {action.label}
      </Button>
    );

  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-4 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-300/30 bg-sky-100/70 text-sky-600 dark:border-sky-400/30 dark:bg-sky-950/45 dark:text-sky-400">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <h3 className={TYPO_CARD_TITLE}>{title}</h3>
        <p className={TYPO_SUBTITLE}>{description}</p>
      </div>
      {actionButton}
    </div>
  );
}
