import { describe, expect, it, vi } from "vitest";
import {
  failure,
  GENERIC_ERROR_MESSAGE,
  jsonResponse,
  errorResponse,
  NO_STORE_CACHE_CONTROL,
  PRIVATE_CACHE_CONTROL,
} from "@/lib/api/responses";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";

const STATUS_BY_CODE = [
  ["VALIDATION_FAILED", 400],
  ["RATE_LIMITED", 429],
  ["UPSTREAM_BLOCKED", 502],
  ["UPSTREAM_TIMEOUT", 502],
  ["UPSTREAM_FAILED", 502],
  ["LLM_NOT_CONFIGURED", 503],
  ["LLM_UNAVAILABLE", 503],
  ["LLM_BAD_OUTPUT", 502],
  ["INTERNAL", 500],
] as const satisfies readonly (readonly [AppErrorCode, number])[];

describe("jsonResponse", () => {
  it("sets JSON content type, cache policy and status", async () => {
    const response = jsonResponse(
      { ok: true, data: { name: "Delhi" } },
      201,
      PRIVATE_CACHE_CONTROL,
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("private, max-age=300");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: { name: "Delhi" },
    });
  });
});

describe("failure", () => {
  it.each(STATUS_BY_CODE)("maps %s to status %i", (code, status) => {
    const response = failure(code, "Safe message.", NO_STORE_CACHE_CONTROL);

    expect(response.status).toBe(status);
  });
});

describe("errorResponse", () => {
  it("adds a default Retry-After to a rate-limited AppError", () => {
    const response = errorResponse(
      new AppError("RATE_LIMITED", "Too many requests."),
      new Request("http://localhost/api/air"),
      NO_STORE_CACHE_CONTROL,
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
  });

  it("uses an AppError's safe message", async () => {
    const response = errorResponse(
      new AppError("UPSTREAM_TIMEOUT", "The service timed out."),
      new Request("http://localhost/api/air"),
      NO_STORE_CACHE_CONTROL,
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: { code: "UPSTREAM_TIMEOUT", message: "The service timed out." },
    });
  });

  it("returns a generic 500 and logs no error details", async () => {
    const log = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const request = new Request("http://localhost/api/air", { method: "POST" });

    const response = errorResponse(
      new Error("internal secret"),
      request,
      NO_STORE_CACHE_CONTROL,
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      ok: false,
      error: { code: "INTERNAL", message: GENERIC_ERROR_MESSAGE },
    });
    expect(log).toHaveBeenCalledWith("Unhandled API error", {
      method: "POST",
      path: "/api/air",
      errorName: "Error",
    });
    expect(JSON.stringify(body)).not.toContain("internal secret");
    log.mockRestore();
  });
});
