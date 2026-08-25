"use client";

import React, { useCallback, useMemo, useRef } from "react";
import { Calendar, Search } from "lucide-react";
import { IoClose } from "react-icons/io5";
import {
  DeferredSelectGate,
  DismissibleFilterChips,
  ExportMenuButton,
} from "@/components/shared";
import type { FilterChipGroup } from "@/components/shared";
import { FILTER_CHIP_COLLAPSED_CLASS } from "@/lib/ui/filter-chip-styles";
import { FILTER_SEARCH_INPUT_SKY_CLASS } from "@/lib/ui/filter-toolbar-styles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV, exportToExcel } from "@/lib/export";
import {
  ACTIVITY_LOG_EXPORT_COLUMNS,
  toActivityLogExportRows,
} from "@/lib/audit/activity-log-export";
import {
  formatActivityDateRangeChip,
  type ActivityLogUserOption,
} from "@/lib/audit/activity-log-filter";
import { AuditActionBadge, formatSemanticLabel } from "@/lib/ui/semantic-badges";
import { DIALOG_NATIVE_DATE_HIDE_INDICATOR } from "@/components/shared/dialog-form-field";
import {
  FOCUS_NO_LAYOUT_SHIFT_CLASS,
  GLASS_FOCUS_RING,
} from "@/lib/ui/focus-ring-styles";
import type { ActivityLogPeriod } from "@/hooks/queries/use-audit-logs";
import type { AuditLog } from "@/types";
import { cn } from "@/lib/utils";
import { ActivityActionFilter } from "./ActivityActionFilter";
import { ActivityEntityFilter } from "./ActivityEntityFilter";
import { ActivityUserSelect } from "./ActivityUserSelect";

const PERIODS: { value: ActivityLogPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 days" },
  { value: "month", label: "Last month" },
];

const ACTIVITY_DATE_INPUT_CLASS = cn(
  "w-full h-10 pr-10 px-2 py-2 text-sm rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 text-gray-700 dark:text-white backdrop-blur-md transition",
  DIALOG_NATIVE_DATE_HIDE_INDICATOR,
  FOCUS_NO_LAYOUT_SHIFT_CLASS,
  GLASS_FOCUS_RING.sky,
);

type ActivityLogFiltersProps = {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedActions: string[];
  setSelectedActions: React.Dispatch<React.SetStateAction<string[]>>;
  selectedEntities: string[];
  setSelectedEntities: React.Dispatch<React.SetStateAction<string[]>>;
  selectedUserId: string;
  setSelectedUserId: (userId: string) => void;
  userOptions: ActivityLogUserOption[];
  startDate: string;
  endDate: string;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  period: ActivityLogPeriod;
  setPeriod: (period: ActivityLogPeriod) => void;
  dataLoading: boolean;
  filteredLogs: AuditLog[];
  onResetPage: () => void;
};

export function ActivityLogFilters({
  searchTerm,
  setSearchTerm,
  selectedActions,
  setSelectedActions,
  selectedEntities,
  setSelectedEntities,
  selectedUserId,
  setSelectedUserId,
  userOptions,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  period,
  setPeriod,
  dataLoading,
  filteredLogs,
  onResetPage,
}: ActivityLogFiltersProps) {
  const { toast } = useToast();
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  const handleResetFilters = useCallback(() => {
    setSelectedActions([]);
    setSelectedEntities([]);
    setSelectedUserId("");
    setStartDate("");
    setEndDate("");
    onResetPage();
  }, [
    setSelectedActions,
    setSelectedEntities,
    setSelectedUserId,
    setStartDate,
    setEndDate,
    onResetPage,
  ]);

  const selectedUser = userOptions.find((user) => user.id === selectedUserId);

  const filterChipGroups = useMemo((): FilterChipGroup[] => {
    const groups: FilterChipGroup[] = [
      {
        label: "Action",
        values: selectedActions,
        onClear: () => setSelectedActions([]),
        renderBadge: (value) => (
          <AuditActionBadge action={value} size="compact" />
        ),
      },
      {
        label: "Entity",
        values: selectedEntities,
        onClear: () => setSelectedEntities([]),
        renderBadge: (value) => (
          <span className={FILTER_CHIP_COLLAPSED_CLASS}>
            {formatSemanticLabel(value)}
          </span>
        ),
      },
    ];

    if (selectedUserId) {
      groups.push({
        label: "User",
        values: [selectedUserId],
        onClear: () => setSelectedUserId(""),
        renderBadge: () => (
          <span className={FILTER_CHIP_COLLAPSED_CLASS}>
            {selectedUser?.name ?? selectedUserId.slice(-8)}
          </span>
        ),
      });
    }

    if (startDate || endDate) {
      groups.push({
        label: "Date",
        values: [formatActivityDateRangeChip(startDate, endDate)],
        onClear: () => {
          setStartDate("");
          setEndDate("");
        },
        renderBadge: (value) => (
          <span className={FILTER_CHIP_COLLAPSED_CLASS}>{value}</span>
        ),
      });
    }

    return groups;
  }, [
    selectedActions,
    selectedEntities,
    selectedUserId,
    selectedUser,
    startDate,
    endDate,
    setSelectedActions,
    setSelectedEntities,
    setSelectedUserId,
    setStartDate,
    setEndDate,
  ]);

  const handleExportToCSV = useCallback(() => {
    try {
      if (filteredLogs.length === 0) {
        toast({
          title: "No Data to Export",
          description:
            "There is no matching activity to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      exportToCSV(
        toActivityLogExportRows(filteredLogs),
        ACTIVITY_LOG_EXPORT_COLUMNS,
        "supply-chain-demo-activity-log",
      );

      toast({
        title: "CSV Export Successful!",
        description: `${filteredLogs.length} activity rows exported to CSV.`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export activity to CSV. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredLogs, toast]);

  const handleExportToExcel = useCallback(async () => {
    try {
      if (filteredLogs.length === 0) {
        toast({
          title: "No Data to Export",
          description:
            "There is no matching activity to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      await exportToExcel({
        sheetName: "Activity Log",
        fileName: "supply-chain-demo-activity-log",
        columns: ACTIVITY_LOG_EXPORT_COLUMNS,
        data: toActivityLogExportRows(filteredLogs),
      });

      toast({
        title: "Excel Export Successful!",
        description: `${filteredLogs.length} activity rows exported to Excel.`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export activity to Excel. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredLogs, toast]);

  return (
    <div className="flex flex-col gap-2 w-full mb-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-2">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/80 z-10" />
          <Input
            placeholder="Search by user, action, entity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={FILTER_SEARCH_INPUT_SKY_CLASS}
          />
          {searchTerm ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white hover:bg-white/10"
            >
              <IoClose className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ActivityActionFilter
            selectedActions={selectedActions}
            setSelectedActions={setSelectedActions}
          />
          <ActivityEntityFilter
            selectedEntities={selectedEntities}
            setSelectedEntities={setSelectedEntities}
          />
          <ActivityUserSelect
            options={userOptions}
            selectedUserId={selectedUserId}
            onUserChange={setSelectedUserId}
          />
          <DeferredSelectGate
            enabled={!dataLoading}
            placeholder={
              <div
                className={cn(
                  "w-full sm:w-[180px] h-10 rounded-[28px] border border-sky-400/30 dark:border-sky-400/30",
                  "bg-sky-100 dark:bg-sky-950/45",
                  "text-gray-700 dark:text-white shadow-sm backdrop-blur-md",
                  "flex items-center px-2 text-sm",
                )}
                aria-hidden
              >
                {PERIODS.find((p) => p.value === period)?.label ?? "Last 7 days"}
              </div>
            }
          >
            {({ selectRemountKey }) => (
              <Select
                key={selectRemountKey}
                value={period}
                onValueChange={(value) => setPeriod(value as ActivityLogPeriod)}
              >
                <SelectTrigger
                  className={cn(
                    "w-full sm:w-[180px] h-10 rounded-[28px] border border-sky-400/30 dark:border-sky-400/30",
                    "bg-sky-100 dark:bg-sky-950/45",
                    "text-gray-700 dark:text-white shadow-sm backdrop-blur-md",
                    "transition duration-200 hover:border-sky-300/40 hover:bg-sky-200 dark:hover:bg-sky-900/50",
                    "dark:hover:border-sky-300/40",
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className="rounded-xl border-sky-400/20 bg-white/95 dark:bg-popover/95 shadow-sm"
                  position="popper"
                >
                  {PERIODS.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                      className="cursor-pointer"
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </DeferredSelectGate>
          <ExportMenuButton
            label="Export"
            accent="violet"
            disabled={filteredLogs.length === 0}
            onExportCsv={handleExportToCSV}
            onExportExcel={handleExportToExcel}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <label
            htmlFor="activity-start-date"
            className="text-sm text-gray-600 dark:text-white/80 whitespace-nowrap w-10 sm:w-auto"
          >
            From:
          </label>
          <div className="relative flex-1 sm:flex-none sm:min-w-[10.5rem]">
            <input
              ref={startDateInputRef}
              id="activity-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={ACTIVITY_DATE_INPUT_CLASS}
              max={endDate || undefined}
            />
            <button
              type="button"
              onClick={() => {
                startDateInputRef.current?.focus();
                startDateInputRef.current?.showPicker?.();
              }}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
                "text-sky-600/80 hover:text-sky-700 dark:text-white/80 dark:hover:text-white",
              )}
              aria-label="Open start date calendar"
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="activity-end-date"
            className="text-sm text-gray-600 dark:text-white/80 whitespace-nowrap w-10 sm:w-auto"
          >
            To:
          </label>
          <div className="relative flex-1 sm:flex-none sm:min-w-[10.5rem]">
            <input
              ref={endDateInputRef}
              id="activity-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={ACTIVITY_DATE_INPUT_CLASS}
              min={startDate || undefined}
            />
            <button
              type="button"
              onClick={() => {
                endDateInputRef.current?.focus();
                endDateInputRef.current?.showPicker?.();
              }}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
                "text-sky-600/80 hover:text-sky-700 dark:text-white/80 dark:hover:text-white",
              )}
              aria-label="Open end date calendar"
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <DismissibleFilterChips
        groups={filterChipGroups}
        onReset={handleResetFilters}
      />
    </div>
  );
}
