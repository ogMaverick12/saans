import { describe, expect, it, vi } from "vitest";
import { withApiGuard } from "@/lib/api/guard";
import { GENERIC_ERROR_MESSAGE } from "@/lib/api/responses";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { buildRequest, createLimiter, TEST_SCHEMA } from "./guard-helpers";

describe("withApiGuard error handling", () => {
  it.each([
    ["VALIDATION_FAILED", 400],
    ["RATE_LIMITED", 429],
    ["UPSTREAM_TIMEOUT", 502],
    ["LLM_NOT_CONFIGURED", 503],
  ] as const)("maps %s to status %i", async (code, status) => {
    const GET = withApiGuard({
      schema: TEST_SCHEMA,
      handler: () => {
        throw new AppError(code, "Safe message.");
      },
      rateLimiter: createLimiter(),
    });

    const response = await GET(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(status);
    expect(body.error).toEqual({ code, message: "Safe message." });
  });

  it("hides unknown error details and logs only safe context", async () => {
    const log = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const GET = withApiGuard({
      schema: TEST_SCHEMA,
      handler: () => {
        throw new Error("database password leaked");
      },
      rateLimiter: createLimiter(),
    });

    const response = await GET(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      ok: false,
      error: { code: "INTERNAL", message: GENERIC_ERROR_MESSAGE },
    });
    expect(JSON.stringify(body)).not.toContain("database");
    expect(log).toHaveBeenCalledWith("Unhandled API error", {
      method: "GET",
      path: "/api/test",
      errorName: "Error",
    });
    log.mockRestore();
  });
});
