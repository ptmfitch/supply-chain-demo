/**
 * Theme classes for table footer page-size Select (matches per-domain table accents).
 */

import {
  paginationPopoverContentClass,
  READABLE_POPOVER_ITEM_CLASS,
} from "@/lib/ui/popover-readability-styles";

export type PaginationSelectVariant =
  | "sky"
  | "violet"
  | "rose"
  | "teal"
  | "amber"
  | "emerald";

export type PaginationSelectVariantStyles = {
  placeholder: string;
  trigger: string;
  content: string;
  item: string;
};

export const PAGINATION_SELECT_VARIANTS: Record<
  PaginationSelectVariant,
  PaginationSelectVariantStyles
> = {
  sky: {
    placeholder:
      "h-10 rounded-[28px] border border-sky-400/30 dark:border-sky-400/30 bg-sky-100 dark:bg-sky-950/45 text-gray-700 dark:text-white px-2 w-16 sm:w-20 flex items-center justify-between font-normal",
    trigger:
      "h-10 rounded-[28px] border border-sky-400/30 dark:border-sky-400/30 bg-sky-100 dark:bg-sky-950/45 text-gray-700 dark:text-white shadow-sm backdrop-blur-md transition duration-200 hover:border-sky-300/40 hover:bg-sky-200 dark:hover:bg-sky-900/50 dark:hover:border-sky-300/40 hover:bg-sky-200 dark:hover:bg-sky-900/50 font-normal px-2 w-16 sm:w-20",
    content: paginationPopoverContentClass("sky"),
    item: READABLE_POPOVER_ITEM_CLASS,
  },
  violet: {
    placeholder:
      "h-10 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-violet-100 dark:bg-violet-950/45 text-gray-700 dark:text-white px-2 w-16 sm:w-20 flex items-center justify-between font-normal",
    trigger:
      "h-10 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-violet-100 dark:bg-violet-950/45 text-gray-700 dark:text-white shadow-sm backdrop-blur-md transition duration-200 hover:border-violet-300/40 hover:bg-violet-200 dark:hover:bg-violet-900/50 dark:hover:border-violet-300/40 hover:bg-violet-200 dark:hover:bg-violet-900/50 font-normal px-2 w-16 sm:w-20",
    content: paginationPopoverContentClass("violet"),
    item: READABLE_POPOVER_ITEM_CLASS,
  },
  rose: {
    placeholder:
      "h-10 rounded-[28px] border border-rose-400/30 dark:border-rose-400/30 bg-rose-100 dark:bg-rose-950/45 text-gray-700 dark:text-white px-2 w-16 sm:w-20 flex items-center justify-between font-normal",
    trigger:
      "h-10 rounded-[28px] border border-rose-400/30 dark:border-rose-400/30 bg-rose-100 dark:bg-rose-950/45 text-gray-700 dark:text-white shadow-sm backdrop-blur-md transition duration-200 hover:border-rose-300/40 hover:bg-rose-200 dark:hover:bg-rose-900/50 dark:hover:border-rose-300/40 hover:bg-rose-200 dark:hover:bg-rose-900/50 font-normal px-2 w-16 sm:w-20",
    content: paginationPopoverContentClass("rose"),
    item: READABLE_POPOVER_ITEM_CLASS,
  },
  teal: {
    placeholder:
      "h-10 rounded-[28px] border border-teal-400/30 dark:border-teal-400/30 bg-teal-100 dark:bg-teal-950/45 text-gray-700 dark:text-white px-2 w-16 sm:w-20 flex items-center justify-between font-normal",
    trigger:
      "h-10 rounded-[28px] border border-teal-400/30 dark:border-teal-400/30 bg-teal-100 dark:bg-teal-950/45 text-gray-700 dark:text-white shadow-sm backdrop-blur-md transition duration-200 hover:border-teal-300/40 font-normal px-2 w-16 sm:w-20",
    content: paginationPopoverContentClass("teal"),
    item: READABLE_POPOVER_ITEM_CLASS,
  },
  amber: {
    placeholder:
      "h-10 rounded-[28px] border border-amber-400/30 dark:border-amber-400/30 bg-amber-100 dark:bg-amber-950/45 text-gray-700 dark:text-white px-2 w-16 sm:w-20 flex items-center justify-between font-normal",
    trigger:
      "h-10 rounded-[28px] border border-amber-400/30 dark:border-amber-400/30 bg-amber-100 dark:bg-amber-950/45 text-gray-700 dark:text-white shadow-sm backdrop-blur-md transition duration-200 hover:border-amber-300/40 font-normal px-2 w-16 sm:w-20",
    content: paginationPopoverContentClass("amber"),
    item: READABLE_POPOVER_ITEM_CLASS,
  },
  emerald: {
    placeholder:
      "h-10 rounded-[28px] border border-emerald-400/30 dark:border-emerald-400/30 bg-emerald-100 dark:bg-emerald-950/45 text-gray-700 dark:text-white px-2 w-16 sm:w-20 flex items-center justify-between font-normal",
    trigger:
      "h-10 rounded-[28px] border border-emerald-400/30 dark:border-emerald-400/30 bg-emerald-100 dark:bg-emerald-950/45 text-gray-700 dark:text-white shadow-sm backdrop-blur-md transition duration-200 hover:border-emerald-300/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 dark:hover:border-emerald-300/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 font-normal px-2 w-16 sm:w-20",
    content: paginationPopoverContentClass("emerald"),
    item: READABLE_POPOVER_ITEM_CLASS,
  },
};

export const PAGE_SIZE_OPTIONS = [4, 6, 8, 10, 15, 20, 30] as const;
