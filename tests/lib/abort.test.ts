import { describe, expect, it } from "vitest";
import { isAbortError } from "@/lib/abort";

describe("isAbortError", () => {
  it("recognises DOMException and named abort errors", () => {
    expect(isAbortError(new DOMException("Aborted", "AbortError"))).toBe(true);
    expect(isAbortError({ name: "AbortError" })).toBe(true);
  });

  it("rejects other errors and non-object values", () => {
    expect(isAbortError(new Error("failed"))).toBe(false);
    expect(isAbortError(null)).toBe(false);
    expect(isAbortError("AbortError")).toBe(false);
    expect(isAbortError({ message: "no name" })).toBe(false);
  });
});
