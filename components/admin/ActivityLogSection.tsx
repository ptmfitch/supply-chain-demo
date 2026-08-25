"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  SectionCardHeader,
  ClientDateTime,
} from "@/components/shared";
import PaginationSelector, {
  type PaginationType,
} from "@/components/shared/PaginationSelector";
import Link from "next/link";
import {
  useAuditLogs,
  type ActivityLogPeriod,
} from "@/hooks/queries/use-audit-logs";
import { isDataSlotLoading } from "@/lib/react-query";
import { cn } from "@/lib/utils";
import type { AuditLog } from "@/types";
import { AuditActionBadge } from "@/lib/ui/semantic-badges";
import { Button } from "@/components/ui/button";
import { ScrollText } from "lucide-react";
import { GrFormPrevious, GrFormNext } from "react-icons/gr";
import { BiFirstPage, BiLastPage } from "react-icons/bi";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableBodyPulseRows } from "@/components/ui/table-data-skeleton";
import { useClampPaginationIndex } from "@/hooks/use-clamp-pagination-index";
import { getActivityDetailLines } from "@/lib/audit/activity-log-details";
import {
  activityLogHasActiveFilters,
  filterActivityLogs,
  listActivityLogUsers,
} from "@/lib/audit/activity-log-filter";
import { CARD_EMPTY_MESSAGE_CLASS } from "@/lib/ui/card-empty-styles";
import { ActivityLogFilters } from "./ActivityLogFilters";

const variantConfig = {
  border: "border-violet-400/20",
  gradient: "bg-violet-100 dark:bg-violet-950/45",
  shadow: "shadow-sm",
};

function getActivityDetails(log: AuditLog): React.ReactNode {
  return (
    <span className="whitespace-pre-line text-gray-700 dark:text-gray-300">
      {getActivityDetailLines(log).join("\n")}
    </span>
  );
}

function entityLink(
  entityType: string,
  entityId: string | null | undefined,
): string | null {
  if (!entityId) return null;
  const base = "/admin";
  switch (entityType) {
    case "product":
      return `${base}/products/${entityId}`;
    case "order":
      return `${base}/orders/${entityId}`;
    case "invoice":
      return `${base}/invoices/${entityId}`;
    case "user":
      return `${base}/user-management/${entityId}`;
    case "supplier":
      return `${base}/suppliers/${entityId}`;
    case "category":
      return `${base}/categories/${entityId}`;
    case "warehouse":
      return `${base}/warehouses/${entityId}`;
    case "ticket":
      return `${base}/support-tickets/${entityId}`;
    case "review":
      return `${base}/product-reviews/${entityId}`;
    default:
      return null;
  }
}

export type ActivityLogSectionProps = {
  initialLogs?: AuditLog[];
  initialPeriod?: ActivityLogPeriod;
};

export default function ActivityLogSection({
  initialLogs,
  initialPeriod = "7days",
}: ActivityLogSectionProps) {
  const [period, setPeriod] = useState<ActivityLogPeriod>(initialPeriod);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pagination, setPagination] = useState<PaginationType>({
    pageIndex: 0,
    pageSize: 8,
  });

  const initialAuditData =
    initialLogs != null && period === initialPeriod
      ? { logs: initialLogs, pagination: null }
      : undefined;
  const auditQuery = useAuditLogs({ period }, initialAuditData);
  const data = auditQuery.data;
  const dataLoading = isDataSlotLoading(auditQuery, initialAuditData);

  const rawLogs =
    data?.logs ?? (period === initialPeriod ? (initialLogs ?? []) : []);

  const clientFilters = useMemo(
    () => ({
      searchTerm,
      actions: selectedActions,
      entityTypes: selectedEntities,
      userId: selectedUserId,
      startDate,
      endDate,
    }),
    [
      searchTerm,
      selectedActions,
      selectedEntities,
      selectedUserId,
      startDate,
      endDate,
    ],
  );

  const logs = useMemo(
    () => filterActivityLogs(rawLogs, clientFilters),
    [rawLogs, clientFilters],
  );

  const userOptions = useMemo(() => listActivityLogUsers(rawLogs), [rawLogs]);
  const hasActiveFilters = activityLogHasActiveFilters(clientFilters);

  useClampPaginationIndex(logs.length, pagination, setPagination);

  React.useEffect(() => {
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );
  }, [searchTerm, selectedActions, selectedEntities, selectedUserId, startDate, endDate]);

  const handlePeriodChange = useCallback((next: ActivityLogPeriod) => {
    setPeriod(next);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleResetPage = useCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        id: "adminUser",
        header: "Admin User",
        cell: ({ row }) => {
          const log = row.original;
          const name =
            log.user?.name ??
            log.user?.username ??
            log.user?.email ??
            log.userId.slice(-8);
          const email = log.user?.email ?? "—";
          return (
            <div className="flex flex-col min-w-0">
              <span className="font-normal text-gray-700 dark:text-gray-200">
                {name}
              </span>
              <span
                className="truncate max-w-[200px] text-muted-foreground"
                title={email}
              >
                {email}
              </span>
            </div>
          );
        },
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => <AuditActionBadge action={row.original.action} />,
      },
      {
        id: "entity",
        header: "Entity",
        cell: ({ row }) => {
          const log = row.original;
          const link = entityLink(log.entityType, log.entityId);
          return link ? (
            <Link
              href={link}
              className="font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
            >
              {log.entityType} {log.entityId?.slice(-6)}
            </Link>
          ) : (
            <span className="text-gray-600 dark:text-gray-300">
              {log.entityType}
              {log.entityId ? ` ${log.entityId.slice(-6)}` : ""}
            </span>
          );
        },
      },
      {
        id: "activityDetails",
        header: "Activity details",
        cell: ({ row }) => (
          <div className="max-w-[320px] min-w-[180px]">
            {getActivityDetails(row.original)}
          </div>
        ),
      },
      {
        id: "when",
        header: "When",
        cell: ({ row }) => (
          <ClientDateTime
            date={row.original.createdAt}
            semantic="created"
            className="whitespace-nowrap"
          />
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: logs,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageCount = Math.max(1, table.getPageCount());

  return (
    <article
      className={cn(
        "rounded-[20px] border p-2 sm:p-4 backdrop-blur-md",
        "bg-white/60 dark:bg-white/5",
        variantConfig.border,
        variantConfig.gradient,
        variantConfig.shadow,
      )}
    >
      <SectionCardHeader
        icon={ScrollText}
        tone="sky"
        title="Activity Logs"
        description={
          <>
            Store actions (create, update, delete) in the loaded period window.
            Last{" "}
            {period === "today"
              ? "24 hours"
              : period === "7days"
                ? "7 days"
                : "30 days"}
            .
          </>
        }
        className="mb-4"
      />
      <ActivityLogFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedActions={selectedActions}
        setSelectedActions={setSelectedActions}
        selectedEntities={selectedEntities}
        setSelectedEntities={setSelectedEntities}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        userOptions={userOptions}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        period={period}
        setPeriod={handlePeriodChange}
        dataLoading={dataLoading}
        filteredLogs={logs}
        onResetPage={handleResetPage}
      />
      {dataLoading && logs.length === 0 ? (
        <div className="overflow-x-auto rounded-xl border border-violet-200/30 dark:border-white/10">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-violet-200/30 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-transparent"
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
            <TableBodyPulseRows rows={6} columnCount={5} />
          </Table>
        </div>
      ) : logs.length === 0 ? (
        <p className={CARD_EMPTY_MESSAGE_CLASS}>
          {hasActiveFilters
            ? "No matching activity."
            : "No activity in this period."}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-violet-200/30 dark:border-white/10">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-violet-200/30 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-transparent"
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
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-violet-100/30 dark:border-white/5 hover:bg-white/30 dark:hover:bg-white/5"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-2 py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-4">
            <PaginationSelector
              pagination={pagination}
              setPagination={setPagination}
              variant="violet"
              layout="inline"
              enabled={!dataLoading}
            />
            <div className="flex items-center justify-center sm:justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="h-10 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-violet-100 dark:bg-violet-950/45 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BiFirstPage />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-10 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-violet-100 dark:bg-violet-950/45 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GrFormPrevious />
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                Page {pagination.pageIndex + 1} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-10 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-violet-100 dark:bg-violet-950/45 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GrFormNext />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={!table.getCanNextPage()}
                className="h-10 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-violet-100 dark:bg-violet-950/45 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BiLastPage />
              </Button>
            </div>
          </div>
        </>
      )}
    </article>
  );
}
