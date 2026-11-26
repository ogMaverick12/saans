import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  ALLOWED_HOSTS,
  DEFAULT_GEMINI_FALLBACK_MODEL,
  DEFAULT_GEMINI_MODEL,
  ENV_VAR_NAMES,
} from "@/lib/config";

const MANAGED_NAMES = Object.values(ENV_VAR_NAMES);
const ORIGINAL_ENV = new Map(
  MANAGED_NAMES.map((name) => [name, process.env[name]]),
);

/**
 * Restores every managed environment variable to its value before the suite.
 */
function restoreOriginalEnv(): void {
  for (const [name, value] of ORIGINAL_ENV) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}

beforeEach(() => {
  for (const name of MANAGED_NAMES) {
    delete process.env[name];
  }
});

afterAll(() => {
  restoreOriginalEnv();
});

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

  it("lists every environment variable name in .env.example", () => {
    const example = readFileSync(
      resolve(process.cwd(), ".env.example"),
      "utf8",
    );

    for (const name of MANAGED_NAMES) {
      expect(example).toContain(name);
    }
  });
});

