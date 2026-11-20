import { describe, expect, it } from "vitest";
import { z } from "zod";
import { formatIssues, readInput } from "@/lib/api/input";

describe("formatIssues", () => {
  it("prefixes each issue with its field path", () => {
    const result = z
      .object({ q: z.string().min(2) })
      .safeParse({ q: "a" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatIssues(result.error)).toContain("q:");
    }
  });

  it("leaves a root-level issue unprefixed", () => {
    const result = z.string().min(1, "Required").safeParse("");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatIssues(result.error)).toBe("Required");
    }
  });
});

describe("readInput", () => {
  it("reads GET query parameters into an object", async () => {
    const request = new Request("http://localhost/api/test?q=Delhi&page=2");

    await expect(readInput(request)).resolves.toEqual({
      ok: true,
      value: { q: "Delhi", page: "2" },
    });
  });

  it("returns an empty object for a GET without a query string", async () => {
    const request = new Request("http://localhost/api/test");

    await expect(readInput(request)).resolves.toEqual({
      ok: true,
      value: {},
    });
  });

  it("parses a JSON body for non-GET methods", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ q: "Delhi" }),
    });

    await expect(readInput(request)).resolves.toEqual({
      ok: true,
      value: { q: "Delhi" },
    });
  });

  it("reports malformed JSON as a safe failure", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: "{",
    });

    await expect(readInput(request)).resolves.toEqual({
      ok: false,
      message: "Send a valid JSON request body.",
    });
  });
});
