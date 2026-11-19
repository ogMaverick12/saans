import { describe, expect, it } from "vitest";
import {
  ALLOWED_HOSTS,
  DEFAULT_GEMINI_FALLBACK_MODEL,
  DEFAULT_GEMINI_MODEL,
  ENV_VAR_NAMES,
} from "@/lib/config";

describe("config", () => {
  it("allowlists bare hostnames that can be used with HTTPS", () => {
    for (const host of ALLOWED_HOSTS) {
      expect(host).not.toMatch(/^https?:\/\//);
      expect(host).toContain(".");
    }
  });

  it("maps every environment setting to a unique upper-case variable name", () => {
    const names = Object.values(ENV_VAR_NAMES);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) {
      expect(name).toBe(name.toUpperCase());
    }
  });

  it("rejects an unknown host and keeps non-empty model defaults", () => {
    expect(ALLOWED_HOSTS).not.toContain("example.com");
    expect(DEFAULT_GEMINI_MODEL.length).toBeGreaterThan(0);
    expect(DEFAULT_GEMINI_FALLBACK_MODEL.length).toBeGreaterThan(0);
  });
});
