import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { assertAllowedHost } from "@/lib/security/allowlist";

/**
 * Asserts that a URL is blocked and returns the resulting application error.
 */
function blockedError(url: string): AppError {
  try {
    assertAllowedHost(new URL(url));
  } catch (error) {
    if (error instanceof AppError) {
      return error;
    }
  }
  throw new Error(`Expected ${url} to be blocked`);
}

describe("assertAllowedHost", () => {
  it("allows an HTTPS URL on the allowlist", () => {
    expect(() =>
      assertAllowedHost(
        new URL("https://air-quality-api.open-meteo.com/v1/air-quality"),
      ),
    ).not.toThrow();
  });

  it("blocks plain HTTP even on an allowlisted host", () => {
    const error = blockedError("http://air-quality-api.open-meteo.com/v1/air");

    expect(error.code).toBe("UPSTREAM_BLOCKED");
    expect(error.safeMessage).toContain("not allowed");
  });

  it("blocks an unknown host", () => {
    expect(blockedError("https://evil.example.com/steal").code).toBe(
      "UPSTREAM_BLOCKED",
    );
  });

  it("blocks a lookalike domain that only contains an allowed name", () => {
    expect(
      blockedError("https://api.open-meteo.com.evil.example/v1/forecast").code,
    ).toBe("UPSTREAM_BLOCKED");
  });
});
