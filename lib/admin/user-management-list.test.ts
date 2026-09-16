import { describe, expect, it } from "vitest";
import { formatStableDate } from "@/lib/format";
import type { UserForAdmin } from "@/types";
import {
  buildUserManagementExportRows,
  filterUserManagementList,
  getDisplayUsername,
} from "./user-management-list";

function user(
  overrides: Partial<UserForAdmin> & Pick<UserForAdmin, "id" | "email" | "name">,
): UserForAdmin {
  return {
    username: null,
    role: "client",
    image: null,
    createdAt: "2026-03-15T12:00:00.000Z",
    updatedAt: null,
    ...overrides,
  };
}

const USERS: UserForAdmin[] = [
  user({
    id: "1",
    name: "Ada Admin",
    email: "ada@example.com",
    username: "ada",
    role: "admin",
  }),
  user({
    id: "2",
    name: "Sam Supplier",
    email: "sam.supplier@example.com",
    username: null,
    role: "supplier",
  }),
  user({
    id: "3",
    name: "Casey Client",
    email: "casey@example.com",
    username: "casey",
    role: "client",
  }),
  user({
    id: "4",
    name: "No Role",
    email: "norole@example.com",
    username: "norole",
    role: null,
  }),
];

describe("getDisplayUsername", () => {
  it("prefers a trimmed username", () => {
    expect(getDisplayUsername({ username: "  ada  ", email: "ada@x.com" })).toBe(
      "ada",
    );
  });

  it("falls back to the email local-part when username is empty", () => {
    expect(getDisplayUsername({ username: null, email: "sam.supplier@x.com" })).toBe(
      "sam.supplier",
    );
    expect(getDisplayUsername({ username: "   ", email: "casey@x.com" })).toBe(
      "casey",
    );
  });

  it("returns an em dash when neither username nor email local-part exist", () => {
    expect(getDisplayUsername({ username: null, email: "" })).toBe("—");
  });
});

describe("filterUserManagementList", () => {
  it("returns all users when search and roles are empty", () => {
    expect(filterUserManagementList(USERS, "", [])).toEqual(USERS);
  });

  it("matches name, email, username, and email local-part", () => {
    expect(filterUserManagementList(USERS, "Ada", []).map((u) => u.id)).toEqual([
      "1",
    ]);
    expect(
      filterUserManagementList(USERS, "casey@example", []).map((u) => u.id),
    ).toEqual(["3"]);
    expect(filterUserManagementList(USERS, "ada", []).map((u) => u.id)).toEqual([
      "1",
    ]);
    expect(
      filterUserManagementList(USERS, "sam.supplier", []).map((u) => u.id),
    ).toEqual(["2"]);
  });

  it("filters by selected roles, treating null role as user", () => {
    expect(
      filterUserManagementList(USERS, "", ["admin", "supplier"]).map((u) => u.id),
    ).toEqual(["1", "2"]);
    expect(filterUserManagementList(USERS, "", ["user"]).map((u) => u.id)).toEqual([
      "4",
    ]);
  });

  it("ANDs search with role filters across the full list", () => {
    expect(
      filterUserManagementList(USERS, "example.com", ["client"]).map((u) => u.id),
    ).toEqual(["3"]);
    expect(filterUserManagementList(USERS, "nobody", ["admin"])).toEqual([]);
  });
});

describe("buildUserManagementExportRows", () => {
  it("maps table fields and formats created dates with formatStableDate", () => {
    const rows = buildUserManagementExportRows([USERS[1]!, USERS[0]!]);
    expect(rows).toEqual([
      {
        Name: "Sam Supplier",
        Username: "sam.supplier",
        Email: "sam.supplier@example.com",
        Role: "supplier",
        "Created Date": formatStableDate("2026-03-15T12:00:00.000Z"),
      },
      {
        Name: "Ada Admin",
        Username: "ada",
        Email: "ada@example.com",
        Role: "admin",
        "Created Date": formatStableDate("2026-03-15T12:00:00.000Z"),
      },
    ]);
    expect(rows[0]!["Created Date"]).toBe("Mar 15, 2026");
  });

  it("does not include overview counts or secrets", () => {
    const rows = buildUserManagementExportRows([
      user({
        id: "5",
        name: "Counted",
        email: "counted@example.com",
        username: "counted",
        role: "client",
        overview: {
          orderCount: 9,
          invoiceCount: 4,
          totalRevenue: 100,
          totalSpent: 50,
          totalDue: 10,
          productCount: 2,
          supplierCount: 1,
          categoryCount: 1,
          warehouseCount: 1,
        },
      }),
    ]);
    expect(Object.keys(rows[0]!)).toEqual([
      "Name",
      "Username",
      "Email",
      "Role",
      "Created Date",
    ]);
  });
});
