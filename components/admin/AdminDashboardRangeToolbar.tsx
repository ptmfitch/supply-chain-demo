/**
 * SCD-11 — Store Overview date-range toolbar.
 * From–To picker (Business Insights pattern), preset shortcuts, and CSV/Excel
 * export of the range-scoped chart series + Top Products rows.
 */

"use client";

import React, { useCallback, useRef } from "react";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportMenuButton } from "@/components/shared";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_RANGE_PRESETS,
  formatRangeDateLabel,
  getDashboardRangeForPreset,
  getDefaultDashboardRange,
  type DashboardDateRange,
} from "@/lib/insights/dashboard-range";
import { DIALOG_NATIVE_DATE_HIDE_INDICATOR } from "@/components/shared/dialog-form-field";
import {
  FOCUS_NO_LAYOUT_SHIFT_CLASS,
  GLASS_FOCUS_RING,
} from "@/lib/ui/focus-ring-styles";
import type { DashboardRangeAnalytics } from "@/types";

/** Same recipe as Business Insights' date inputs (REQ-0223 native indicator hidden). */
const DASHBOARD_RANGE_DATE_INPUT_CLASS = cn(
  "w-full h-10 pr-10 px-2 py-2 text-sm rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 text-gray-700 dark:text-white backdrop-blur-md transition",
  DIALOG_NATIVE_DATE_HIDE_INDICATOR,
  FOCUS_NO_LAYOUT_SHIFT_CLASS,
  GLASS_FOCUS_RING.violet,
);

export type AdminDashboardRangeToolbarProps = {
  range: DashboardDateRange;
  onRangeChange: (range: DashboardDateRange) => void;
  isDefaultRange: boolean;
  /** Data currently shown in the range-scoped sections (null while loading). */
  rangeAnalytics: DashboardRangeAnalytics | null;
};

function buildTrendRows(analytics: DashboardRangeAnalytics) {
  return analytics.trends.map((t) => ({
    Period: t.label,
    Orders: t.orders,
    "Order Revenue": t.revenue,
    "New Products": t.products,
    Invoices: t.invoices,
  }));
}

function buildTopProductRows(analytics: DashboardRangeAnalytics) {
  return analytics.topProducts.slice(0, 5).map((p) => ({
    Product: p.productName,
    SKU: p.sku ?? "",
    Category: p.categoryName ?? "-",
    Supplier: p.supplierName ?? "-",
    Lines: p.orderCount,
    Qty: p.totalQuantity,
    Revenue: p.totalRevenue,
  }));
}

function buildStatusRows(analytics: DashboardRangeAnalytics) {
  const o = analytics.orderStatusDistribution;
  const i = analytics.invoiceStatusDistribution;
  return [
    { Kind: "Order", Status: "Pending", Count: o.pending },
    { Kind: "Order", Status: "Confirmed", Count: o.confirmed },
    { Kind: "Order", Status: "Processing", Count: o.processing },
    { Kind: "Order", Status: "Shipped", Count: o.shipped },
    { Kind: "Order", Status: "Delivered", Count: o.delivered },
    { Kind: "Order", Status: "Cancelled", Count: o.cancelled },
    { Kind: "Invoice", Status: "Draft", Count: i.draft },
    { Kind: "Invoice", Status: "Sent", Count: i.sent },
    { Kind: "Invoice", Status: "Paid", Count: i.paid },
    { Kind: "Invoice", Status: "Overdue", Count: i.overdue },
    { Kind: "Invoice", Status: "Cancelled", Count: i.cancelled },
  ];
}

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

export default function AdminDashboardRangeToolbar({
  range,
  onRangeChange,
  isDefaultRange,
  rangeAnalytics,
}: AdminDashboardRangeToolbarProps) {
  const { toast } = useToast();
  const fromInputRef = useRef<HTMLInputElement | null>(null);
  const toInputRef = useRef<HTMLInputElement | null>(null);

  const exportToCSV = useCallback(() => {
    try {
      if (!rangeAnalytics) {
        toast({
          title: "No Data to Export",
          description: "Dashboard data is still loading for this range.",
          variant: "destructive",
        });
        return;
      }
      const sections = [
        Papa.unparse([
          {
            From: formatRangeDateLabel(rangeAnalytics.from),
            To: formatRangeDateLabel(rangeAnalytics.to),
          },
        ]),
        Papa.unparse(buildTrendRows(rangeAnalytics)),
        Papa.unparse(buildTopProductRows(rangeAnalytics)),
        Papa.unparse(buildStatusRows(rangeAnalytics)),
      ];
      const csv = sections.join("\r\n\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, `dashboard_${range.from}_${range.to}.csv`);
      toast({
        title: "Export Successful",
        description: `Dashboard data for ${formatRangeDateLabel(range.from)} – ${formatRangeDateLabel(range.to)} exported to CSV`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export dashboard data to CSV",
        variant: "destructive",
      });
    }
  }, [range.from, range.to, rangeAnalytics, toast]);

  const exportToExcel = useCallback(async () => {
    try {
      if (!rangeAnalytics) {
        toast({
          title: "No Data to Export",
          description: "Dashboard data is still loading for this range.",
          variant: "destructive",
        });
        return;
      }
      const workbook = new ExcelJS.Workbook();

      const trendSheet = workbook.addWorksheet("Trends");
      trendSheet.columns = [
        { header: "Period", key: "Period", width: 16 },
        { header: "Orders", key: "Orders", width: 10 },
        { header: "Order Revenue", key: "Order Revenue", width: 16 },
        { header: "New Products", key: "New Products", width: 14 },
        { header: "Invoices", key: "Invoices", width: 10 },
      ];
      trendSheet.addRows(buildTrendRows(rangeAnalytics));

      const topSheet = workbook.addWorksheet("Top Products");
      topSheet.columns = [
        { header: "Product", key: "Product", width: 28 },
        { header: "SKU", key: "SKU", width: 16 },
        { header: "Category", key: "Category", width: 18 },
        { header: "Supplier", key: "Supplier", width: 18 },
        { header: "Lines", key: "Lines", width: 8 },
        { header: "Qty", key: "Qty", width: 8 },
        { header: "Revenue", key: "Revenue", width: 14 },
      ];
      topSheet.addRows(buildTopProductRows(rangeAnalytics));

      const statusSheet = workbook.addWorksheet("Status Distributions");
      statusSheet.columns = [
        { header: "Kind", key: "Kind", width: 10 },
        { header: "Status", key: "Status", width: 14 },
        { header: "Count", key: "Count", width: 8 },
      ];
      statusSheet.addRows(buildStatusRows(rangeAnalytics));

      for (const sheet of [trendSheet, topSheet, statusSheet]) {
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0E0E0" },
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, `dashboard_${range.from}_${range.to}.xlsx`);
      toast({
        title: "Export Successful",
        description: `Dashboard data for ${formatRangeDateLabel(range.from)} – ${formatRangeDateLabel(range.to)} exported to Excel`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export dashboard data to Excel",
        variant: "destructive",
      });
    }
  }, [range.from, range.to, rangeAnalytics, toast]);

  return (
    <div className="rounded-[16px] border border-violet-400/20 bg-violet-100 dark:bg-violet-950/45 p-4 backdrop-blur-md shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-300/30 bg-violet-100/50 dark:border-white/15 dark:bg-white/10">
            <Calendar className="h-4 w-4 text-gray-700 dark:text-white/80" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700 dark:text-white/80">
              Date range
            </span>
            <span className="text-xs text-gray-500 dark:text-white/60">
              Applies to charts &amp; Top Products. KPI cards stay all-time.
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 flex-1">
          <div className="flex items-center gap-2">
            <label
              htmlFor="dashboard-range-from"
              className="text-sm text-gray-600 dark:text-white/80 whitespace-nowrap w-10 sm:w-auto"
            >
              From:
            </label>
            <div className="relative flex-1 sm:flex-none sm:min-w-[10.5rem]">
              <input
                ref={fromInputRef}
                id="dashboard-range-from"
                type="date"
                value={range.from}
                onChange={(e) =>
                  e.target.value &&
                  onRangeChange({ ...range, from: e.target.value })
                }
                className={DASHBOARD_RANGE_DATE_INPUT_CLASS}
                max={range.to || undefined}
              />
              <button
                type="button"
                onClick={() => {
                  fromInputRef.current?.focus();
                  fromInputRef.current?.showPicker?.();
                }}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
                  "text-violet-600/80 hover:text-violet-700 dark:text-white/80 dark:hover:text-white",
                )}
                aria-label="Open start date calendar"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="dashboard-range-to"
              className="text-sm text-gray-600 dark:text-white/80 whitespace-nowrap w-10 sm:w-auto"
            >
              To:
            </label>
            <div className="relative flex-1 sm:flex-none sm:min-w-[10.5rem]">
              <input
                ref={toInputRef}
                id="dashboard-range-to"
                type="date"
                value={range.to}
                onChange={(e) =>
                  e.target.value &&
                  onRangeChange({ ...range, to: e.target.value })
                }
                className={DASHBOARD_RANGE_DATE_INPUT_CLASS}
                min={range.from || undefined}
              />
              <button
                type="button"
                onClick={() => {
                  toInputRef.current?.focus();
                  toInputRef.current?.showPicker?.();
                }}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
                  "text-violet-600/80 hover:text-violet-700 dark:text-white/80 dark:hover:text-white",
                )}
                aria-label="Open end date calendar"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {DASHBOARD_RANGE_PRESETS.map((preset) => {
              const presetRange = getDashboardRangeForPreset(preset.key);
              const isActive =
                presetRange.from === range.from && presetRange.to === range.to;
              return (
                <Button
                  key={preset.key}
                  variant="outline"
                  size="sm"
                  onClick={() => onRangeChange(presetRange)}
                  className={cn(
                    "h-8 rounded-xl text-xs border-violet-400/30",
                    isActive
                      ? "bg-violet-200/80 dark:bg-violet-900/60 border-violet-400/60 text-violet-800 dark:text-white"
                      : "bg-white/40 dark:bg-white/5 text-gray-600 dark:text-white/70 hover:bg-violet-100/60 dark:hover:bg-white/10",
                  )}
                >
                  {preset.label}
                </Button>
              );
            })}
            {!isDefaultRange && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRangeChange(getDefaultDashboardRange())}
                className="h-8 flex items-center gap-1 rounded-xl text-xs border-rose-400/30 hover:border-rose-300/50 hover:bg-rose-500/10"
              >
                <X className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className="shrink-0">
          <ExportMenuButton
            label="Export Dashboard"
            accent="violet"
            onExportCsv={exportToCSV}
            onExportExcel={exportToExcel}
            disabled={!rangeAnalytics}
          />
        </div>
      </div>
    </div>
  );
}
