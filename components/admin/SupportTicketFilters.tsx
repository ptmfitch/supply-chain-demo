/**
 * Support Ticket Filters
 * Search and filter controls for support tickets list (SCD-21 CSV/Excel export)
 */

"use client";

import { FILTER_SEARCH_INPUT_SKY_CLASS } from "@/lib/ui/filter-toolbar-styles";
import React, { useCallback, useMemo } from "react";
import {
  DeferredSelectGate,
  DismissibleFilterChips,
  ExportMenuButton,
} from "@/components/shared";
import type { FilterChipGroup } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { IoClose } from "react-icons/io5";
import { TicketStatusDropDown } from "@/components/support-tickets/TicketStatusFilter";
import { TicketPriorityDropDown } from "@/components/support-tickets/TicketPriorityFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import type { SupportTicketViewFilter } from "@/hooks/queries/use-support-tickets";
import { PaginationType } from "@/components/shared/PaginationSelector";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/lib/ui/semantic-badges";
import { FILTER_CHIP_COLLAPSED_CLASS } from "@/lib/ui/filter-chip-styles";
import { useToast } from "@/hooks/use-toast";
import {
  exportToCSV,
  exportToExcel,
  filterSupportTickets,
  mapSupportTicketsToExportRows,
  SUPPORT_TICKET_EXPORT_COLUMNS,
  SUPPORT_TICKET_EXPORT_EXCEL_COLUMNS,
  SUPPORT_TICKET_EXPORT_FILE_STEM,
  SUPPORT_TICKET_EXPORT_SHEET,
} from "@/lib/export";
import { logger } from "@/lib/logger";
import type { SupportTicket } from "@/types";

const VIEW_OPTIONS: { value: SupportTicketViewFilter; label: string }[] = [
  { value: "all", label: "All tickets" },
  { value: "assigned_to_me", label: "Assigned to me" },
  { value: "created_by_me", label: "Created by me" },
];

interface SupportTicketFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedStatuses: string[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>;
  selectedPriorities: string[];
  setSelectedPriorities: React.Dispatch<React.SetStateAction<string[]>>;
  viewFilter?: SupportTicketViewFilter;
  onViewFilterChange?: (view: SupportTicketViewFilter) => void;
  setPagination?: React.Dispatch<React.SetStateAction<PaginationType>>;
  /** View-scoped list from the parent — do not re-apply assigned_to_me here. */
  allTickets: SupportTicket[];
}

export default function SupportTicketFilters({
  searchTerm,
  setSearchTerm,
  selectedStatuses,
  setSelectedStatuses,
  selectedPriorities,
  setSelectedPriorities,
  viewFilter = "all",
  onViewFilterChange,
  setPagination,
  allTickets,
}: SupportTicketFiltersProps) {
  const { toast } = useToast();

  const filteredTickets = useMemo(
    () =>
      filterSupportTickets(allTickets, {
        searchTerm,
        selectedStatuses,
        selectedPriorities,
      }),
    [allTickets, searchTerm, selectedStatuses, selectedPriorities],
  );

  const handleExportToCSV = useCallback(() => {
    try {
      if (filteredTickets.length === 0) {
        toast({
          title: "No Data to Export",
          description:
            "There are no support tickets to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      exportToCSV(
        mapSupportTicketsToExportRows(filteredTickets),
        SUPPORT_TICKET_EXPORT_COLUMNS,
        SUPPORT_TICKET_EXPORT_FILE_STEM,
      );

      toast({
        title: "CSV Export Successful!",
        description: `${filteredTickets.length} support tickets exported to CSV file.`,
      });
    } catch (error) {
      logger.warn("Support ticket CSV export failed:", error);
      toast({
        title: "Export Failed",
        description:
          "Failed to export support tickets to CSV. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredTickets, toast]);

  const handleExportToExcel = useCallback(async () => {
    try {
      if (filteredTickets.length === 0) {
        toast({
          title: "No Data to Export",
          description:
            "There are no support tickets to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      await exportToExcel({
        sheetName: SUPPORT_TICKET_EXPORT_SHEET,
        fileName: SUPPORT_TICKET_EXPORT_FILE_STEM,
        columns: SUPPORT_TICKET_EXPORT_EXCEL_COLUMNS,
        data: mapSupportTicketsToExportRows(filteredTickets),
      });

      toast({
        title: "Excel Export Successful!",
        description: `${filteredTickets.length} support tickets exported to Excel file.`,
      });
    } catch (error) {
      logger.warn("Support ticket Excel export failed:", error);
      toast({
        title: "Export Failed",
        description:
          "Failed to export support tickets to Excel. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredTickets, toast]);

  const handleResetFilters = useCallback(() => {
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    onViewFilterChange?.("all");
    setPagination?.((prev) => ({ ...prev, pageIndex: 0 }));
  }, [
    setSelectedStatuses,
    setSelectedPriorities,
    onViewFilterChange,
    setPagination,
  ]);

  const filterChipGroups = useMemo((): FilterChipGroup[] => {
    const groups: FilterChipGroup[] = [];

    if (onViewFilterChange && viewFilter !== "all") {
      const viewLabel =
        VIEW_OPTIONS.find((o) => o.value === viewFilter)?.label ?? viewFilter;
      groups.push({
        label: "View",
        values: [viewFilter],
        onClear: () => onViewFilterChange("all"),
        renderBadge: () => (
          <span className={FILTER_CHIP_COLLAPSED_CLASS}>{viewLabel}</span>
        ),
      });
    }

    groups.push(
      {
        label: "Status",
        values: selectedStatuses,
        onClear: () => setSelectedStatuses([]),
        renderBadge: (value) => (
          <TicketStatusBadge status={value} size="compact" />
        ),
      },
      {
        label: "Priority",
        values: selectedPriorities,
        onClear: () => setSelectedPriorities([]),
        renderBadge: (value) => (
          <TicketPriorityBadge status={value} size="compact" />
        ),
      },
    );

    return groups;
  }, [
    onViewFilterChange,
    viewFilter,
    selectedStatuses,
    selectedPriorities,
    setSelectedStatuses,
    setSelectedPriorities,
  ]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/80 z-10" />
          <Input
            placeholder="Search by subject or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={FILTER_SEARCH_INPUT_SKY_CLASS}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-md"
            >
              <IoClose className="h-4 w-4 text-gray-700 dark:text-white/80" />
            </Button>
          )}
        </div>
        {onViewFilterChange && (
          <DeferredSelectGate
            placeholder={
              <div
                className="h-10 w-[180px] rounded-[28px] border border-violet-400/30 bg-white/10 dark:bg-white/5 text-gray-700 dark:text-white flex items-center justify-between px-2 py-2"
                aria-hidden
              >
                <span>
                  {VIEW_OPTIONS.find((o) => o.value === viewFilter)?.label ??
                    "View"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-70" />
              </div>
            }
          >
            {({ selectRemountKey }) => (
              <Select
                key={selectRemountKey}
                value={viewFilter}
                onValueChange={(v) =>
                  onViewFilterChange(v as SupportTicketViewFilter)
                }
              >
                <SelectTrigger className="h-10 w-[180px] rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-white/10 dark:bg-white/5 text-gray-700 dark:text-white">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-violet-400/20">
                  {VIEW_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="cursor-pointer"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </DeferredSelectGate>
        )}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <TicketStatusDropDown
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
          />
          <TicketPriorityDropDown
            selectedPriorities={selectedPriorities}
            setSelectedPriorities={setSelectedPriorities}
          />
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <ExportMenuButton
            label="Export Tickets"
            accent="violet"
            disabled={filteredTickets.length === 0}
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
