/**
 * History (Import History) Filters
 * Search and filter controls for import history list (SCD-21 CSV/Excel export)
 */

"use client";

import { FILTER_SEARCH_INPUT_SKY_CLASS } from "@/lib/ui/filter-toolbar-styles";
import React, { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { IoClose } from "react-icons/io5";
import { ImportTypeDropDown } from "./ImportTypeFilter";
import { ImportStatusDropDown } from "./ImportStatusFilter";
import { DismissibleFilterChips, ExportMenuButton } from "@/components/shared";
import type { FilterChipGroup } from "@/components/shared";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { ImportStatusBadge, ImportTypeBadge } from "@/lib/ui/semantic-badges";
import { useToast } from "@/hooks/use-toast";
import {
  exportToCSV,
  exportToExcel,
  filterImportHistory,
  IMPORT_HISTORY_EXPORT_COLUMNS,
  IMPORT_HISTORY_EXPORT_EXCEL_COLUMNS,
  IMPORT_HISTORY_EXPORT_FILE_STEM,
  IMPORT_HISTORY_EXPORT_SHEET,
  mapImportHistoryToExportRows,
} from "@/lib/export";
import { logger } from "@/lib/logger";
import type { ImportHistoryForPage } from "@/types";

interface HistoryFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedImportTypes: string[];
  setSelectedImportTypes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedStatuses: string[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>;
  setPagination?: React.Dispatch<React.SetStateAction<PaginationType>>;
  allRecords: ImportHistoryForPage[];
}

export default function HistoryFilters({
  searchTerm,
  setSearchTerm,
  selectedImportTypes,
  setSelectedImportTypes,
  selectedStatuses,
  setSelectedStatuses,
  setPagination,
  allRecords,
}: HistoryFiltersProps) {
  const { toast } = useToast();

  const filteredRecords = useMemo(
    () =>
      filterImportHistory(allRecords, {
        searchTerm,
        selectedImportTypes,
        selectedStatuses,
      }),
    [allRecords, searchTerm, selectedImportTypes, selectedStatuses],
  );

  const handleExportToCSV = useCallback(() => {
    try {
      if (filteredRecords.length === 0) {
        toast({
          title: "No Data to Export",
          description:
            "There is no import history to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      exportToCSV(
        mapImportHistoryToExportRows(filteredRecords),
        IMPORT_HISTORY_EXPORT_COLUMNS,
        IMPORT_HISTORY_EXPORT_FILE_STEM,
      );

      toast({
        title: "CSV Export Successful!",
        description: `${filteredRecords.length} import history rows exported to CSV file.`,
      });
    } catch (error) {
      logger.warn("Import history CSV export failed:", error);
      toast({
        title: "Export Failed",
        description:
          "Failed to export import history to CSV. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredRecords, toast]);

  const handleExportToExcel = useCallback(async () => {
    try {
      if (filteredRecords.length === 0) {
        toast({
          title: "No Data to Export",
          description:
            "There is no import history to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      await exportToExcel({
        sheetName: IMPORT_HISTORY_EXPORT_SHEET,
        fileName: IMPORT_HISTORY_EXPORT_FILE_STEM,
        columns: IMPORT_HISTORY_EXPORT_EXCEL_COLUMNS,
        data: mapImportHistoryToExportRows(filteredRecords),
      });

      toast({
        title: "Excel Export Successful!",
        description: `${filteredRecords.length} import history rows exported to Excel file.`,
      });
    } catch (error) {
      logger.warn("Import history Excel export failed:", error);
      toast({
        title: "Export Failed",
        description:
          "Failed to export import history to Excel. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredRecords, toast]);

  const handleResetFilters = useCallback(() => {
    setSelectedImportTypes([]);
    setSelectedStatuses([]);
    setPagination?.((prev) => ({ ...prev, pageIndex: 0 }));
  }, [setSelectedImportTypes, setSelectedStatuses, setPagination]);

  const filterChipGroups = useMemo((): FilterChipGroup[] => {
    return [
      {
        label: "Type",
        values: selectedImportTypes,
        onClear: () => setSelectedImportTypes([]),
        renderBadge: (value) => (
          <ImportTypeBadge status={value} size="compact" />
        ),
      },
      {
        label: "Status",
        values: selectedStatuses,
        onClear: () => setSelectedStatuses([]),
        renderBadge: (value) => (
          <ImportStatusBadge status={value} size="compact" />
        ),
      },
    ];
  }, [
    selectedImportTypes,
    selectedStatuses,
    setSelectedImportTypes,
    setSelectedStatuses,
  ]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/80 z-10" />
          <Input
            placeholder="Search by file name or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={FILTER_SEARCH_INPUT_SKY_CLASS}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white hover:bg-white/10"
            >
              <IoClose className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <ImportTypeDropDown
            selectedImportTypes={selectedImportTypes}
            setSelectedImportTypes={setSelectedImportTypes}
          />
          <ImportStatusDropDown
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
          />
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <ExportMenuButton
            label="Export History"
            accent="violet"
            disabled={filteredRecords.length === 0}
            onExportCsv={handleExportToCSV}
            onExportExcel={handleExportToExcel}
          />
        </div>
      </div>

      <DismissibleFilterChips
        groups={filterChipGroups}
        onReset={handleResetFilters}
      />
    </div>
  );
}
