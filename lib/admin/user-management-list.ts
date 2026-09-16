/**
 * SCD-9 — client-safe User Management list filter + export rows.
 * Shared so the table and CSV/Excel export stay on the same predicate.
 */

import { formatStableDate } from "@/lib/format";
import type { UserForAdmin } from "@/types";

export function getDisplayUsername(user: Pick<UserForAdmin, "username" | "email">): string {
  if (user.username?.trim()) return user.username.trim();
  const email = user.email ?? "";
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : "—";
}

export function filterUserManagementList(
  users: UserForAdmin[],
  searchTerm: string,
  selectedRoles: string[],
): UserForAdmin[] {
  const term = searchTerm.toLowerCase();
  return users.filter((user) => {
    const emailPrefix = (user.email ?? "").split("@")[0] ?? "";
    const searchMatch =
      !searchTerm ||
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      (user.username ?? "").toLowerCase().includes(term) ||
      emailPrefix.toLowerCase().includes(term);
    const roleMatch =
      selectedRoles.length === 0 ||
      selectedRoles.includes(user.role ?? "user");
    return searchMatch && roleMatch;
  });
}

export const USER_MANAGEMENT_EXPORT_COLUMNS = [
  { header: "Name", key: "Name", width: 24 },
  { header: "Username", key: "Username", width: 18 },
  { header: "Email", key: "Email", width: 28 },
  { header: "Role", key: "Role", width: 12 },
  { header: "Created Date", key: "Created Date", width: 16 },
] as const;

export type UserManagementExportRow = {
  Name: string;
  Username: string;
  Email: string;
  Role: string;
  "Created Date": string;
};

/** Columns already shown on the list (no overview counts — list DTO omits them). */
export function buildUserManagementExportRows(
  users: UserForAdmin[],
): UserManagementExportRow[] {
  return users.map((user) => ({
    Name: user.name,
    Username: getDisplayUsername(user),
    Email: user.email,
    Role: user.role ?? "user",
    "Created Date": formatStableDate(user.createdAt),
  }));
}
