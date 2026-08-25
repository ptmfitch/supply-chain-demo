/**
 * SCD-10 — map filtered activity rows for CSV / Excel.
 * Timestamps use the stable format hub (date + time).
 */

import { formatStableDateTime } from "@/lib/format";
import { getActivityDetailLines } from "@/lib/audit/activity-log-details";
import type { AuditLog } from "@/types";

export type ActivityLogExportRow = {
  When: string;
  User: string;
  Email: string;
  Action: string;
  Entity: string;
  "Entity ID": string;
  Details: string;
};

export const ACTIVITY_LOG_EXPORT_COLUMNS: Array<{
  header: keyof ActivityLogExportRow;
  key: keyof ActivityLogExportRow;
  width: number;
}> = [
  { header: "When", key: "When", width: 22 },
  { header: "User", key: "User", width: 22 },
  { header: "Email", key: "Email", width: 28 },
  { header: "Action", key: "Action", width: 16 },
  { header: "Entity", key: "Entity", width: 16 },
  { header: "Entity ID", key: "Entity ID", width: 28 },
  { header: "Details", key: "Details", width: 48 },
];

export function toActivityLogExportRows(
  logs: AuditLog[],
): ActivityLogExportRow[] {
  return logs.map((log) => ({
    When: formatStableDateTime(log.createdAt),
    User:
      log.user?.name ??
      log.user?.username ??
      log.user?.email ??
      log.userId.slice(-8),
    Email: log.user?.email ?? "",
    Action: log.action,
    Entity: log.entityType,
    "Entity ID": log.entityId ?? "",
    Details: getActivityDetailLines(log).join("; "),
  }));
}
