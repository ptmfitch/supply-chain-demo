/**
 * History (Import History) List Component
 * List view for admin import history with KPI strip, filters, table, and detail links
 * REQ-0233 / SCD-23 — stat cards above filters (no CSV export; SCD-21 is separate)
 */

"use client";

import React, { useState, useMemo } from "react";
import { useHistory } from "@/hooks/queries";
import { isDataSlotLoading, queryKeys, useSyncSsrQueryData } from "@/lib/react-query";
import {
  APP_SHELL_WIDTH_CLASS,
  PAGE_STATS_GRID_CLASS,
} from "@/lib/ui/shell-layout-styles";
import { cn } from "@/lib/utils";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { PageSectionHeader } from "@/components/shared";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { summarizeImportHistoryKpis } from "@/lib/history/import-history-kpis";
import { createHistoryColumns } from "./HistoryTableColumns";
import HistoryFilters from "./HistoryFilters";
import { HistoryTable } from "./HistoryTable";
import type { ImportHistoryForPage } from "@/types";

export type HistoryListProps = {
  /** When set (e.g. "/admin/activity-history"), View links use {detailHrefBase}/{id} */
  detailHrefBase?: string;
  /** SSR-passed history for first-render hydration (REQ-0021) */
  initialHistory?: ImportHistoryForPage[];
};

export default function HistoryList({
  detailHrefBase,
  initialHistory,
}: HistoryListProps = {}) {
  const historyQuery = useHistory(initialHistory);

  useSyncSsrQueryData(queryKeys.history.lists(), initialHistory);

  const allRecords = historyQuery.data ?? initialHistory ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationType>({
    pageIndex: 0,
    pageSize: 8,
  });
  const [selectedImportTypes, setSelectedImportTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const columns = useMemo(
    () => createHistoryColumns(detailHrefBase ?? "/admin/activity-history"),
    [detailHrefBase],
  );

  const kpis = useMemo(
    () => summarizeImportHistoryKpis(allRecords),
    [allRecords],
  );

  // REQ-0021: shell-first — only data values pulse (header, card chrome, filters, table frame stay)
  const historyDataLoading = isDataSlotLoading(historyQuery, initialHistory);

  return (
    <div className="flex flex-col poppins">
      <PageSectionHeader
        as="h2"
        icon={Upload}
        tone="blue"
        title="Import History"
        description="Bulk import runs (CSV/Excel). Data appears here when you use Import for products, orders, suppliers, or categories. View details, success/failed rows, and error logs."
      />

      <div className={cn(PAGE_STATS_GRID_CLASS, "grid-cols-1 sm:grid-cols-3")}>
        <StatisticsCard
          title="Total imports"
          value={kpis.totalImports}
          description="Import runs in this list"
          icon={Upload}
          variant="blue"
          valueLoading={historyDataLoading}
        />
        <StatisticsCard
          title="Rows succeeded"
          value={kpis.rowsSucceeded}
          description="Rows that succeeded across imports"
          icon={CheckCircle2}
          variant="emerald"
          valueLoading={historyDataLoading}
        />
        <StatisticsCard
          title="Rows failed"
          value={kpis.rowsFailed}
          description="Rows that failed across imports"
          icon={AlertCircle}
          variant="rose"
          valueLoading={historyDataLoading}
        />
      </div>

      <div className="pb-6 flex justify-start">
        <div className={APP_SHELL_WIDTH_CLASS}>
          <HistoryFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedImportTypes={selectedImportTypes}
            setSelectedImportTypes={setSelectedImportTypes}
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
            setPagination={setPagination}
          />
        </div>
      </div>

      <HistoryTable
        data={allRecords}
        columns={columns}
        isLoading={historyDataLoading}
        searchTerm={searchTerm}
        pagination={pagination}
        setPagination={setPagination}
        selectedImportTypes={selectedImportTypes}
        selectedStatuses={selectedStatuses}
      />
    </div>
  );
}
