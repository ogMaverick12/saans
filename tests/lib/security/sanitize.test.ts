import { describe, expect, it } from "vitest";
import { FREE_TEXT_MAX_CHARS } from "@/lib/config";
import { sanitizeFreeText } from "@/lib/security/sanitize";

describe("sanitizeFreeText", () => {
  it("trims and collapses whitespace", () => {
    expect(sanitizeFreeText("  hello \n\t world  ")).toBe("hello world");
  });

  it("strips control characters and angle brackets", () => {
    expect(sanitizeFreeText("a\u0000b<c>d\u009Fe")).toBe("abcde");
  });

  it("truncates to the configured character limit", () => {
    const result = sanitizeFreeText("a".repeat(FREE_TEXT_MAX_CHARS + 50));

    expect(result).toHaveLength(FREE_TEXT_MAX_CHARS);
  });

  it("accepts a caller-supplied character limit", () => {
    const result = sanitizeFreeText("a".repeat(300), 300);

    expect(result).toHaveLength(300);
  });

  it("preserves non-Latin text and empty input", () => {
    expect(sanitizeFreeText("  हवा साफ है  ")).toBe("हवा साफ है");
    expect(sanitizeFreeText("   ")).toBe("");
  });
});
