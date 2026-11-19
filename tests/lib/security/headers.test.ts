import { describe, expect, it } from "vitest";
import {
  buildSecurityHeaders,
  type SecurityHeader,
} from "@/lib/security/headers";

/**
 * Reads one header value by name, failing the test when it is absent.
 */
function headerValue(headers: SecurityHeader[], key: string): string {
  const header = headers.find((candidate) => candidate.key === key);
  if (header === undefined) {
    throw new Error(`Missing header ${key}`);
  }
  return header.value;
}

describe("buildSecurityHeaders", () => {
  it("locks the policy down in production", () => {
    const policy = headerValue(
      buildSecurityHeaders(false),
      "Content-Security-Policy",
    );

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("script-src 'self' 'unsafe-inline'");
    expect(policy).toContain("style-src 'self' 'unsafe-inline'");
    expect(policy).toContain("img-src 'self' data:");
    expect(policy).toContain("connect-src 'self'");
    expect(policy).toContain("font-src 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).not.toContain("'unsafe-eval'");
  });

  it("allows eval only in development", () => {
    const policy = headerValue(
      buildSecurityHeaders(true),
      "Content-Security-Policy",
    );

    expect(policy).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  });

  it("sets the companion headers", () => {
    const headers = buildSecurityHeaders(false);

    expect(headerValue(headers, "X-Content-Type-Options")).toBe("nosniff");
    expect(headerValue(headers, "Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headerValue(headers, "Permissions-Policy")).toBe(
      "geolocation=(self), camera=(), microphone=()",
    );
  });
});
