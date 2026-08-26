/**
 * SCD-15 — generic admin portal Directory section.
 * Full data table with text search, activity filter chips, sortable columns,
 * shared pagination, and CSV/Excel export of the filtered rows.
 * Used by AdminClientPortalContent (clients) and AdminSupplierPortalContent
 * (suppliers) with entity-specific columns.
 */

"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { Search } from "lucide-react";
import { IoClose } from "react-icons/io5";
import type { LucideIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableBodyPulseRows } from "@/components/ui/table-data-skeleton";
import PaginationSelector, {
  type PaginationType,
} from "@/components/shared/PaginationSelector";
import { useClampPaginationIndex } from "@/hooks/use-clamp-pagination-index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GrFormPrevious, GrFormNext } from "react-icons/gr";
import { BiFirstPage, BiLastPage } from "react-icons/bi";
import {
  ExportMenuButton,
  GlassCard,
  SectionCardHeader,
  SectionCountBadge,
} from "@/components/shared";
import { useToast } from "@/hooks/use-toast";
import { FILTER_SEARCH_INPUT_SKY_CLASS } from "@/lib/ui/filter-toolbar-styles";
import {
  DIRECTORY_ACTIVITY_OPTIONS,
  filterDirectoryRows,
  type DirectoryActivityFilter,
} from "@/lib/insights/portal-directory";
import { cn } from "@/lib/utils";

type DirectoryRowBase = {
  name: string;
  email: string | null;
  lastActivityAt: string | null;
};

export type AdminPortalDirectoryProps<T extends DirectoryRowBase> = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "violet" | "emerald";
  rows: T[];
  loading: boolean;
  columns: ColumnDef<T>[];
  getRowKey: (row: T) => string;
  searchPlaceholder: string;
  emptyMessage: string;
  exportLabel: string;
  exportFileStem: string;
  buildExportRows: (rows: T[]) => Record<string, string | number>[];
  /** Optional trailing content (e.g. a Manage Users button) */
  footer?: React.ReactNode;
};

function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function AdminPortalDirectory<T extends DirectoryRowBase>({
  title,
  description,
  icon,
  tone,
  rows,
  loading,
  columns,
  getRowKey,
  searchPlaceholder,
  emptyMessage,
  exportLabel,
  exportFileStem,
  buildExportRows,
  footer,
}: AdminPortalDirectoryProps<T>) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activityFilter, setActivityFilter] =
    useState<DirectoryActivityFilter>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    pageIndex: 0,
    pageSize: 8,
  });

  const filteredRows = useMemo(
    () => filterDirectoryRows(rows, searchTerm, activityFilter),
    [rows, searchTerm, activityFilter],
  );

  useClampPaginationIndex(filteredRows.length, pagination, setPagination);

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { pagination, sorting },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => getRowKey(row),
  });

  const exportToCSV = useCallback(() => {
    try {
      if (filteredRows.length === 0) {
        toast({
          title: "No Data to Export",
          description: "There are no rows to export with the current filters.",
          variant: "destructive",
        });
        return;
      }
      const csv = Papa.unparse(buildExportRows(filteredRows));
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      downloadBlob(
        blob,
        `${exportFileStem}_${new Date().toISOString().split("T")[0]}.csv`,
      );
      toast({
        title: "Export Successful",
        description: `${filteredRows.length} row(s) exported to CSV`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export directory to CSV",
        variant: "destructive",
      });
    }
  }, [buildExportRows, exportFileStem, filteredRows, toast]);

  const exportToExcel = useCallback(async () => {
    try {
      if (filteredRows.length === 0) {
        toast({
          title: "No Data to Export",
          description: "There are no rows to export with the current filters.",
          variant: "destructive",
        });
        return;
      }
      const exportRows = buildExportRows(filteredRows);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Directory");
      const headers = Object.keys(exportRows[0] ?? {});
      worksheet.columns = headers.map((h) => ({
        header: h,
        key: h,
        width: Math.max(12, Math.min(30, h.length + 8)),
      }));
      worksheet.addRows(exportRows);
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(
        blob,
        `${exportFileStem}_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      toast({
        title: "Export Successful",
        description: `${filteredRows.length} row(s) exported to Excel`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export directory to Excel",
        variant: "destructive",
      });
    }
  }, [buildExportRows, exportFileStem, filteredRows, toast]);

  const borderClass =
    tone === "violet"
      ? "border-violet-400/20 dark:border-white/10"
      : "border-emerald-400/20 dark:border-white/10";
  const pageButtonClass =
    tone === "violet"
      ? "h-10 rounded-[28px] border border-violet-400/30 bg-violet-100 dark:bg-violet-950/45 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      : "h-10 rounded-[28px] border border-emerald-400/30 bg-emerald-100 dark:bg-emerald-950/45 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <GlassCard padding="body" variant={tone}>
      <SectionCardHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            {title}
            <SectionCountBadge>{filteredRows.length}</SectionCountBadge>
          </span>
        }
        description={description}
        icon={icon}
        tone={tone}
        className="mb-4"
      />

      {/* Toolbar — search | activity chips | export */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-4">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/80 z-10" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={FILTER_SEARCH_INPUT_SKY_CLASS}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white hover:bg-white/10 backdrop-blur-md"
            >
              <IoClose className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {DIRECTORY_ACTIVITY_OPTIONS.map((option) => {
            const isActive = option.key === activityFilter;
            return (
              <Button
                key={option.key}
                variant="outline"
                size="sm"
                onClick={() => {
                  setActivityFilter(option.key);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                className={cn(
                  "h-8 rounded-xl text-xs",
                  tone === "violet"
                    ? "border-violet-400/30"
                    : "border-emerald-400/30",
                  isActive
                    ? tone === "violet"
                      ? "bg-violet-200/80 dark:bg-violet-900/60 border-violet-400/60 text-violet-800 dark:text-white"
                      : "bg-emerald-200/80 dark:bg-emerald-900/60 border-emerald-400/60 text-emerald-800 dark:text-white"
                    : "bg-white/40 dark:bg-white/5 text-gray-600 dark:text-white/70 hover:bg-white/60 dark:hover:bg-white/10",
                )}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
        <div className="lg:ml-auto shrink-0">
          <ExportMenuButton
            label={exportLabel}
            // ExportAccent has no emerald — teal is the closest existing hue
            accent={tone === "violet" ? "violet" : "teal"}
            onExportCsv={exportToCSV}
            onExportExcel={exportToExcel}
            disabled={!loading && filteredRows.length === 0}
          />
        </div>
      </div>

      <div
        className={cn(
          "rounded-[28px] border shadow-sm bg-white/90 dark:bg-stone-900/80 backdrop-blur-md overflow-hidden",
          borderClass,
        )}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-white/40 dark:bg-white/10"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          {loading ? (
            <TableBodyPulseRows
              rows={pagination.pageSize}
              columnCount={columns.length}
            />
          ) : (
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    className={
                      index % 2 === 0
                        ? "bg-white/30 dark:bg-white/5"
                        : "bg-white/20 dark:bg-white/10"
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center text-gray-700 dark:text-white"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-4">
        <PaginationSelector
          pagination={pagination}
          setPagination={setPagination}
          variant={tone}
          layout="inline"
          enabled={!loading}
        />
        <div className="flex items-center justify-center sm:justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className={pageButtonClass}
          >
            <BiFirstPage />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={pageButtonClass}
          >
            <GrFormPrevious />
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
            Page {pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={pageButtonClass}
          >
            <GrFormNext />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className={pageButtonClass}
          >
            <BiLastPage />
          </Button>
        </div>
      </div>
      {footer}
    </GlassCard>
  );
}

/** Shared sortable header for directory numeric/date columns. */
export function DirectorySortableHeader<T>({
  column,
  label,
  align = "left",
}: {
  column: {
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: (desc?: boolean) => void;
  };
  label: string;
  align?: "left" | "right";
  /** Generic tied to ColumnDef context; unused directly. */
  _row?: T;
}) {
  const isSorted = column.getIsSorted();
  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(isSorted === "asc")}
      className={cn(
        "flex items-center gap-1 py-2 text-sm font-normal text-gray-700 dark:text-white select-none cursor-pointer w-full",
        align === "right" ? "justify-end text-right" : "justify-start",
        isSorted && "text-primary",
      )}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <span aria-hidden className="text-xs opacity-60">
        {isSorted === "asc" ? "↑" : isSorted === "desc" ? "↓" : "↕"}
      </span>
    </button>
  );
}
