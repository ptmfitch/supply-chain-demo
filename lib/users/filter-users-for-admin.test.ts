import { describe, expect, it } from "vitest";
import {
  filterUsersForAdmin,
  getDisplayUsername,
} from "./filter-users-for-admin";
import type { UserForAdmin } from "@/types";

function makeUser(overrides: Partial<UserForAdmin>): UserForAdmin {
  return {
    id: "u1",
    email: "user@example.com",
    name: "User",
    username: null,
    role: "client",
    image: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: null,
    ...overrides,
  };
}

const users: UserForAdmin[] = [
  makeUser({ id: "a", name: "Alice Admin", email: "alice@store.com", username: "alice", role: "admin" }),
  makeUser({ id: "b", name: "Bob Buyer", email: "bob@client.com", username: null, role: "client" }),
  makeUser({ id: "c", name: "Sam Supplier", email: "sam@vendor.com", username: "samv", role: "supplier" }),
  makeUser({ id: "d", name: "No Role", email: "norole@x.com", username: null, role: null }),
];

describe("filterUsersForAdmin", () => {
  it("returns all users with no search and no roles", () => {
    expect(filterUsersForAdmin(users, "", [])).toHaveLength(4);
  });

  it("matches name case-insensitively", () => {
    const result = filterUsersForAdmin(users, "alice", []);
    expect(result.map((u) => u.id)).toEqual(["a"]);
  });

  it("matches email and email prefix", () => {
    expect(filterUsersForAdmin(users, "bob@client.com", [])).toHaveLength(1);
    expect(filterUsersForAdmin(users, "norole", []).map((u) => u.id)).toEqual([
      "d",
    ]);
  });

  it("matches username", () => {
    expect(filterUsersForAdmin(users, "samv", []).map((u) => u.id)).toEqual([
      "c",
    ]);
  });

  it("filters by selected roles", () => {
    const result = filterUsersForAdmin(users, "", ["admin", "supplier"]);
    expect(result.map((u) => u.id)).toEqual(["a", "c"]);
  });

  it("treats null role as \"user\" for role filtering", () => {
    expect(filterUsersForAdmin(users, "", ["user"]).map((u) => u.id)).toEqual([
      "d",
    ]);
  });

  it("combines search and role filters with AND semantics", () => {
    expect(filterUsersForAdmin(users, "alice", ["client"])).toHaveLength(0);
    expect(filterUsersForAdmin(users, "alice", ["admin"])).toHaveLength(1);
  });
});

describe("getDisplayUsername", () => {
  it("prefers the trimmed username", () => {
    expect(getDisplayUsername(makeUser({ username: " alice " }))).toBe("alice");
  });

  it("falls back to the email prefix", () => {
    expect(getDisplayUsername(makeUser({ username: null, email: "bob@x.com" }))).toBe("bob");
  });

  it("returns an em dash when neither is usable", () => {
    expect(getDisplayUsername(makeUser({ username: null, email: "" }))).toBe(
      "—",
    );
  });
});
