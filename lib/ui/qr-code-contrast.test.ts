import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { TYPO_CARD_TITLE, TYPO_SUBTITLE } from "@/lib/ui/typography-scale";
import { GLASS_ACTION_BUTTON } from "@/lib/ui/glass-button-styles";
import { cn } from "@/lib/utils";

function classTokens(value: string): string[] {
  return value.split(/\s+/).filter(Boolean);
}

describe("QR card dual-theme contrast (SCD-18)", () => {
  it("title token is gray-700 in light mode and white only in dark mode", () => {
    const tokens = classTokens(TYPO_CARD_TITLE);
    expect(tokens).toContain("text-gray-700");
    expect(tokens).toContain("dark:text-white");
    expect(tokens).not.toContain("text-white");
  });

  it("merged QR title row does not keep a light-mode white color", () => {
    const tokens = classTokens(cn("flex items-center gap-2", TYPO_CARD_TITLE));
    expect(tokens).toContain("text-gray-700");
    expect(tokens).not.toContain("text-white");
  });

  it("download action token is dark text on a pale fill in light mode", () => {
    const tokens = classTokens(GLASS_ACTION_BUTTON.sky);
    expect(tokens).toContain("text-sky-900");
    expect(tokens).not.toContain("text-white");
  });

  it("qr-code components use dual-theme tokens instead of hardcoded text-white", () => {
    const qr = readFileSync(
      resolve(__dirname, "../../components/ui/qr-code.tsx"),
      "utf8",
    );
    const hover = readFileSync(
      resolve(__dirname, "../../components/ui/qr-code-hover.tsx"),
      "utf8",
    );

    expect(qr).toContain("TYPO_CARD_TITLE");
    expect(qr).toContain("GLASS_ACTION_BUTTON.sky");
    expect(qr).not.toMatch(/\btext-white\b/);

    expect(hover).toContain("TYPO_SUBTITLE");
    expect(classTokens(TYPO_SUBTITLE)).toContain("text-gray-600");
    expect(hover).not.toMatch(/\btext-white\b/);
  });
});
