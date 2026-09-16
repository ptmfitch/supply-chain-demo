/**
 * User Management Filters
 */

"use client";

import { FILTER_SEARCH_INPUT_SKY_CLASS } from "@/lib/ui/filter-toolbar-styles";
import React, { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { IoClose } from "react-icons/io5";
import { UserRoleDropDown } from "./UserRoleFilter";
import { DismissibleFilterChips, ExportMenuButton } from "@/components/shared";
import type { FilterChipGroup } from "@/components/shared";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { UserRoleBadge } from "@/lib/ui/semantic-badges";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV, exportToExcel } from "@/lib/export";
import {
  USER_MANAGEMENT_EXPORT_COLUMNS,
  buildUserManagementExportRows,
  filterUserManagementList,
} from "@/lib/admin/user-management-list";
import type { UserForAdmin } from "@/types";

interface UserManagementFiltersProps {
  allUsers: UserForAdmin[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedRoles: string[];
  setSelectedRoles: React.Dispatch<React.SetStateAction<string[]>>;
  setPagination?: React.Dispatch<React.SetStateAction<PaginationType>>;
}

export default function UserManagementFilters({
  allUsers,
  searchTerm,
  setSearchTerm,
  selectedRoles,
  setSelectedRoles,
  setPagination,
}: UserManagementFiltersProps) {
  const { toast } = useToast();

  const filteredUsers = useMemo(
    () => filterUserManagementList(allUsers, searchTerm, selectedRoles),
    [allUsers, searchTerm, selectedRoles],
  );

  const handleExportToCSV = useCallback(() => {
    try {
      if (filteredUsers.length === 0) {
        toast({
          title: "No Data to Export",
          description: "There are no users to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      const csvData = buildUserManagementExportRows(filteredUsers);
      const columns = USER_MANAGEMENT_EXPORT_COLUMNS.map(({ header, key }) => ({
        header,
        key,
      }));

      exportToCSV(csvData, columns, "stockly-users");

      toast({
        title: "CSV Export Successful!",
        description: `${filteredUsers.length} users exported to CSV file.`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export users to CSV. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredUsers, toast]);

  const handleExportToExcel = useCallback(async () => {
    try {
      if (filteredUsers.length === 0) {
        toast({
          title: "No Data to Export",
          description: "There are no users to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      await exportToExcel({
        sheetName: "Users",
        fileName: "stockly-users",
        columns: [...USER_MANAGEMENT_EXPORT_COLUMNS],
        data: buildUserManagementExportRows(filteredUsers),
      });

      toast({
        title: "Excel Export Successful!",
        description: `${filteredUsers.length} users exported to Excel file.`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export users to Excel. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredUsers, toast]);

  const handleResetFilters = useCallback(() => {
    setSelectedRoles([]);
    setPagination?.((prev) => ({ ...prev, pageIndex: 0 }));
  }, [setSelectedRoles, setPagination]);

  const filterChipGroups = useMemo((): FilterChipGroup[] => {
    return [
      {
        label: "Role",
        values: selectedRoles,
        onClear: () => setSelectedRoles([]),
        renderBadge: (value) => <UserRoleBadge role={value} size="compact" />,
      },
    ];
  }, [selectedRoles, setSelectedRoles]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/80 z-10" />
          <Input
            placeholder="Search by name, email, or username..."
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
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <UserRoleDropDown
            selectedRoles={selectedRoles}
            setSelectedRoles={setSelectedRoles}
          />
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <ExportMenuButton
            label="Export Users"
            accent="violet"
            disabled={filteredUsers.length === 0}
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
