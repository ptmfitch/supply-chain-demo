import { describe, expect, it, vi } from "vitest";
import { redirectWithSearch } from "@/lib/navigation/redirect-with-search";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

describe("redirectWithSearch", () => {
  it("redirects without query when search params empty", () => {
    expect(() => redirectWithSearch("/orders")).toThrow("REDIRECT:/orders");
  });

  it("preserves query string on redirect", () => {
    expect(() =>
      redirectWithSearch("/orders", { ownerId: "abc", payment: "success" }),
    ).toThrow("REDIRECT:/orders?ownerId=abc&payment=success");
  });

  it("preserves array query values", () => {
    expect(() =>
      redirectWithSearch("/invoices", { tag: ["a", "b"] }),
    ).toThrow("REDIRECT:/invoices?tag=a&tag=b");
  });
});
