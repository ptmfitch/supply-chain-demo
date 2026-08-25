/**
 * SCD-10 — client-side Activity Log filters over the period-loaded window.
 *
 * Demo scale: GET /api/audit-logs?period=… returns ≤50 rows (FIFO cap).
 * Server-side query params (action / entityType / userId / startDate / endDate)
 * exist on the non-period GET path; wiring them into the period feed is deferred.
 */

import type { AuditAction, AuditEntityType, AuditLog } from "@/types";
import { formatStableDate } from "@/lib/format";
import { getActivityDetailLines } from "@/lib/audit/activity-log-details";

export const ACTIVITY_ACTION_OPTIONS = [
  "create",
  "update",
  "delete",
  "login",
  "logout",
  "view",
  "export",
  "import",
  "send",
  "payment",
  "ship",
  "settings_change",
] as const satisfies readonly AuditAction[];

export const ACTIVITY_ENTITY_OPTIONS = [
  "product",
  "order",
  "invoice",
  "user",
  "supplier",
  "category",
  "warehouse",
  "ticket",
  "review",
  "system_config",
  "auth",
] as const satisfies readonly AuditEntityType[];

export type ActivityLogUserOption = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

export type ActivityLogClientFilters = {
  searchTerm: string;
  actions: string[];
  entityTypes: string[];
  userId: string;
  startDate: string;
  endDate: string;
};

export const EMPTY_ACTIVITY_LOG_FILTERS: ActivityLogClientFilters = {
  searchTerm: "",
  actions: [],
  entityTypes: [],
  userId: "",
  startDate: "",
  endDate: "",
};

/** Parse YYYY-MM-DD as a local calendar day (avoid UTC-midnight shift). */
export function parseIsoDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function dayStartMs(value: string): number | null {
  const date = parseIsoDateOnly(value);
  if (!date) return null;
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function dayEndMs(value: string): number | null {
  const date = parseIsoDateOnly(value);
  if (!date) return null;
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export function activityLogHasActiveFilters(
  filters: ActivityLogClientFilters,
): boolean {
  return (
    filters.searchTerm.trim().length > 0 ||
    filters.actions.length > 0 ||
    filters.entityTypes.length > 0 ||
    filters.userId.length > 0 ||
    filters.startDate.length > 0 ||
    filters.endDate.length > 0
  );
}

export function formatActivityDateRangeChip(
  startDate: string,
  endDate: string,
): string {
  const from = startDate
    ? formatStableDate(parseIsoDateOnly(startDate) ?? startDate)
    : "…";
  const to = endDate
    ? formatStableDate(parseIsoDateOnly(endDate) ?? endDate)
    : "…";
  return `${from} → ${to}`;
}

export function listActivityLogUsers(logs: AuditLog[]): ActivityLogUserOption[] {
  const map = new Map<string, ActivityLogUserOption>();
  for (const log of logs) {
    if (map.has(log.userId)) continue;
    map.set(log.userId, {
      id: log.userId,
      name:
        log.user?.name ??
        log.user?.username ??
        log.user?.email ??
        log.userId.slice(-8),
      email: log.user?.email ?? "",
    });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function matchesSearch(log: AuditLog, term: string): boolean {
  if (!term) return true;
  const name = log.user?.name ?? log.user?.username ?? log.user?.email ?? "";
  const email = log.user?.email ?? "";
  const haystack = [
    name,
    email,
    log.action,
    log.entityType,
    log.entityId ?? "",
    ...getActivityDetailLines(log),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}

/** AND across groups; OR within action / entity multi-select. */
export function filterActivityLogs(
  logs: AuditLog[],
  filters: ActivityLogClientFilters,
): AuditLog[] {
  const term = filters.searchTerm.toLowerCase().trim();
  const startMs = filters.startDate ? dayStartMs(filters.startDate) : null;
  const endMs = filters.endDate ? dayEndMs(filters.endDate) : null;

  return logs.filter((log) => {
    if (filters.actions.length > 0 && !filters.actions.includes(log.action)) {
      return false;
    }
    if (
      filters.entityTypes.length > 0 &&
      !filters.entityTypes.includes(log.entityType)
    ) {
      return false;
    }
    if (filters.userId && log.userId !== filters.userId) {
      return false;
    }
    if (startMs != null || endMs != null) {
      const createdMs = new Date(log.createdAt).getTime();
      if (Number.isNaN(createdMs)) return false;
      if (startMs != null && createdMs < startMs) return false;
      if (endMs != null && createdMs > endMs) return false;
    }
    return matchesSearch(log, term);
  });
}
