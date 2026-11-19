import type { MockInstance } from "vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { logger, type LogContext } from "@/lib/logger";

/**
 * Reads the single JSON line captured by a console spy.
 */
function readLoggedLine(spy: MockInstance): Record<string, unknown> {
  expect(spy).toHaveBeenCalledTimes(1);
  const [line] = spy.mock.calls[0] ?? [];
  expect(typeof line).toBe("string");
  return JSON.parse(String(line)) as Record<string, unknown>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logger", () => {
  it("writes a JSON line with a level, message, time and context", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});

    logger.info("air cache hit", { route: "/api/air", status: 200 });

    const entry = readLoggedLine(spy);
    expect(entry).toMatchObject({
      level: "info",
      message: "air cache hit",
      route: "/api/air",
      status: 200,
    });
    expect(Number.isNaN(Date.parse(String(entry.time)))).toBe(false);
  });

  it("routes warnings and errors to their own console methods", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.warn("rate limit near", { remaining: 2 });
    logger.error("plan failed", { code: "LLM_UNAVAILABLE" });

    expect(readLoggedLine(warnSpy)).toMatchObject({
      level: "warn",
      remaining: 2,
    });
    expect(readLoggedLine(errorSpy)).toMatchObject({
      level: "error",
      code: "LLM_UNAVAILABLE",
    });
  });

  it("drops object values so a request body can never be logged", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const unsafeContext = {
      route: "/api/plan",
      body: { note: "private health answer" },
    } as unknown as LogContext;

    logger.info("request received", unsafeContext);

    const entry = readLoggedLine(spy);
    expect(entry).toMatchObject({ route: "/api/plan" });
    expect(entry).not.toHaveProperty("body");
    expect(JSON.stringify(entry)).not.toContain("private health answer");
  });

  it("drops undefined values and caps the number of context keys", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const oversized = Object.fromEntries(
      Array.from({ length: 30 }, (_, index) => [`key${index}`, index]),
    ) as LogContext;
    const withUndefined = {
      ...oversized,
      missing: undefined,
    } as unknown as LogContext;

    logger.info("many keys", withUndefined);

    const entry = readLoggedLine(spy);
    expect(entry).not.toHaveProperty("missing");
    expect(Object.keys(entry)).toHaveLength(23);
  });
});
