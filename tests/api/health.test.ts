import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  checkHealth: vi.fn(),
  check: vi.fn(),
}));

vi.mock("@/lib/api/health", () => ({
  checkHealth: mocks.checkHealth,
}));
vi.mock("@/lib/api/rate-limit", () => ({
  apiRateLimiter: { check: mocks.check },
}));

import { GET } from "@/app/api/health/route";

const REPORT = {
  probed: false,
  clients: {
    "gemini-primary": { status: "configured" },
    "gemini-fallback": { status: "configured" },
    openrouter: { status: "missing" },
  },
};

/**
 * Builds a health request with a stable client IP.
 */
function buildRequest(query = ""): Request {
  return new Request(`http://localhost/api/health${query}`, {
    headers: { "x-forwarded-for": "203.0.113.14" },
  });
}

describe("GET /api/health", () => {
  beforeEach(() => {
    mocks.checkHealth.mockReset();
    mocks.check.mockReset();
    mocks.check.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.checkHealth.mockResolvedValue(REPORT);
  });

  it("reports configuration without probing by default", async () => {
    const response = await GET(buildRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: REPORT,
    });
    expect(mocks.checkHealth).toHaveBeenCalledWith({ probe: false });
  });

  it("requests a live probe when probe=1", async () => {
    mocks.checkHealth.mockResolvedValue({ ...REPORT, probed: true });

    const response = await GET(buildRequest("?probe=1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.probed).toBe(true);
    expect(mocks.checkHealth).toHaveBeenCalledWith({ probe: true });
  });

  it("rejects an unsupported probe value", async () => {
    const response = await GET(buildRequest("?probe=0"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(mocks.checkHealth).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when the limiter blocks", async () => {
    mocks.check.mockReturnValue({ allowed: false, retryAfterSeconds: 5 });

    const response = await GET(buildRequest());

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("5");
    expect(mocks.checkHealth).not.toHaveBeenCalled();
  });

  it("maps an AppError to its safe status and message", async () => {
    mocks.checkHealth.mockRejectedValue(
      new AppError("LLM_UNAVAILABLE", "The language model is unavailable."),
    );

    const response = await GET(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toEqual({
      code: "LLM_UNAVAILABLE",
      message: "The language model is unavailable.",
    });
  });

  it("hides unknown error details behind a generic 500", async () => {
    mocks.checkHealth.mockRejectedValue(new Error("internal secret"));

    const response = await GET(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL");
    expect(JSON.stringify(body)).not.toContain("internal secret");
  });
});
