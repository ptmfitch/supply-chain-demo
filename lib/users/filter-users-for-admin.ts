/**
 * Shared search/role filter for the admin user list.
 *
 * Single source of truth for `UserManagementTable` (visible rows) and
 * `UserManagementFilters` (CSV/Excel export) so the exported set always
 * matches what the table shows (SCD-9).
 */

import type { UserForAdmin } from "@/types";

/** Derive display username from email when username is empty (e.g. Gmail login) */
export function getDisplayUsername(user: UserForAdmin): string {
  if (user.username?.trim()) return user.username.trim();
  const email = user.email ?? "";
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : "—";
}

export function filterUsersForAdmin(
  users: UserForAdmin[],
  searchTerm: string,
  selectedRoles: string[],
): UserForAdmin[] {
  return users.filter((u) => {
    const emailPrefix = (u.email ?? "").split("@")[0] ?? "";
    const searchMatch =
      !searchTerm ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      emailPrefix.toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch =
      selectedRoles.length === 0 || selectedRoles.includes(u.role ?? "user");
    return searchMatch && roleMatch;
  });
}
