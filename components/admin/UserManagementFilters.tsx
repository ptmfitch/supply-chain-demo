/**
 * User Management Filters
 */

"use client";

import { FILTER_SEARCH_INPUT_SKY_CLASS } from "@/lib/ui/filter-toolbar-styles";
import React, { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { Search } from "lucide-react";
import { IoClose } from "react-icons/io5";
import { UserRoleDropDown } from "./UserRoleFilter";
import { DismissibleFilterChips, ExportMenuButton } from "@/components/shared";
import type { FilterChipGroup } from "@/components/shared";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { UserRoleBadge } from "@/lib/ui/semantic-badges";
import {
  filterUsersForAdmin,
  getDisplayUsername,
} from "@/lib/users/filter-users-for-admin";
import { formatStableDate } from "@/lib/format";
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

  /** Same predicate as UserManagementTable — export matches visible rows */
  const filteredUsers = useMemo(
    () => filterUsersForAdmin(allUsers, searchTerm, selectedRoles),
    [allUsers, searchTerm, selectedRoles],
  );

  const buildExportRows = useCallback(
    () =>
      filteredUsers.map((user) => ({
        Name: user.name,
        Username: getDisplayUsername(user),
        Email: user.email,
        Role: user.role ?? "user",
        Joined: user.createdAt ? formatStableDate(user.createdAt) : "-",
      })),
    [filteredUsers],
  );

  const exportToCSV = useCallback(() => {
    try {
      if (filteredUsers.length === 0) {
        toast({
          title: "No Data to Export",
          description: "There are no users to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      const csv = Papa.unparse(buildExportRows());

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `users_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `${filteredUsers.length} user(s) exported to CSV`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export users to CSV",
        variant: "destructive",
      });
    }
  }, [buildExportRows, filteredUsers.length, toast]);

  const exportToExcel = useCallback(async () => {
    try {
      if (filteredUsers.length === 0) {
        toast({
          title: "No Data to Export",
          description: "There are no users to export with the current filters.",
          variant: "destructive",
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Users");

      worksheet.columns = [
        { header: "Name", key: "Name", width: 25 },
        { header: "Username", key: "Username", width: 20 },
        { header: "Email", key: "Email", width: 30 },
        { header: "Role", key: "Role", width: 12 },
        { header: "Joined", key: "Joined", width: 12 },
      ];

      worksheet.addRows(buildExportRows());

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
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `users_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `${filteredUsers.length} user(s) exported to Excel`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export users to Excel",
        variant: "destructive",
      });
    }
  }, [buildExportRows, filteredUsers.length, toast]);

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
        <div className="flex-shrink-0">
          <ExportMenuButton
            label="Export Users"
            accent="violet"
            onExportCsv={exportToCSV}
            onExportExcel={exportToExcel}
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
