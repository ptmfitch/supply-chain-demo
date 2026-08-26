/**
 * REQ-0231 / SCD-24 — opt-in sticky table header inside the Table scroll wrapper.
 * Catalog tables stay overflow-x only (REQ-0172); pass `stickyHeader` on Table to adopt.
 */

/** Y-scrollport + pinned opaque `<th>` so glass/dark rows never bleed through the header. */
export const TABLE_STICKY_HEADER_WRAP_CLASS = [
  "max-h-[min(50vh,18rem)] overflow-auto overscroll-contain isolate",
  "[&_table]:border-separate [&_table]:border-spacing-0",
  "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-20",
  "[&_thead_th]:bg-white dark:[&_thead_th]:bg-stone-900",
  "[&_thead_th]:shadow-[0_3px_8px_-2px_rgba(0,0,0,0.14)]",
  "dark:[&_thead_th]:shadow-[0_3px_8px_-2px_rgba(0,0,0,0.45)]",
].join(" ");
