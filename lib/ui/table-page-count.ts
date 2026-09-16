/**
 * Empty TanStack tables report `getPageCount() === 0`, which rendered as
 * "Page 1 of 0" (REQ-0231). Keep the footer on a real first page instead.
 */

export function displayTablePageCount(pageCount: number): number {
  if (!Number.isFinite(pageCount) || pageCount < 1) return 1;
  return Math.floor(pageCount);
}

export function tablePageCountFromRows(
  filteredCount: number,
  pageSize: number,
): number {
  const size = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 1;
  const rows =
    Number.isFinite(filteredCount) && filteredCount > 0 ? filteredCount : 0;
  return displayTablePageCount(Math.ceil(rows / size));
}

export function formatTablePageLabel(
  pageIndex: number,
  pageCount: number,
): string {
  const page = Number.isFinite(pageIndex)
    ? Math.max(1, Math.floor(pageIndex) + 1)
    : 1;
  return `Page ${page} of ${displayTablePageCount(pageCount)}`;
}
