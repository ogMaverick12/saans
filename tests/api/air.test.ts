import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { buildDigest } from "../lib/impact/test-data";

const mocks = vi.hoisted(() => ({
  getAirDigest: vi.fn(),
  check: vi.fn(),
}));

vi.mock("@/lib/air/get-digest", () => ({
  getAirDigest: mocks.getAirDigest,
}));
vi.mock("@/lib/api/rate-limit", () => ({
  apiRateLimiter: { check: mocks.check },
}));

import { GET } from "@/app/api/air/route";

/**
 * Builds an air request with a stable client IP.
 */
function buildRequest(query: string): Request {
  return new Request(`http://localhost/api/air?${query}`, {
    headers: { "x-forwarded-for": "203.0.113.11" },
  });
}

describe("GET /api/air", () => {
  beforeEach(() => {
    mocks.getAirDigest.mockReset();
    mocks.check.mockReset();
    mocks.check.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
  });

  it("returns the digest and passes the validated place", async () => {
    const digest = buildDigest();
    mocks.getAirDigest.mockResolvedValue(digest);

    const response = await GET(
      buildRequest("lat=28.61&lon=77.21&name=Delhi&country=India"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, max-age=300");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: digest,
    });
    expect(mocks.getAirDigest).toHaveBeenCalledWith({
      name: "Delhi",
      latitude: 28.61,
      longitude: 77.21,
      countryCode: null,
      country: "India",
      admin1: null,
    });
  });

  it("rejects missing coordinates", async () => {
    const response = await GET(buildRequest("name=Delhi"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.message).toContain("lat:");
    expect(mocks.getAirDigest).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when the limiter blocks", async () => {
    mocks.check.mockReturnValue({ allowed: false, retryAfterSeconds: 9 });

    const response = await GET(buildRequest("lat=28.61&lon=77.21"));

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("9");
    expect(mocks.getAirDigest).not.toHaveBeenCalled();
  });

  it("maps an AppError to its safe status and message", async () => {
    mocks.getAirDigest.mockRejectedValue(
      new AppError("UPSTREAM_TIMEOUT", "The air service timed out."),
    );

    const response = await GET(buildRequest("lat=28.61&lon=77.21"));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toEqual({
      code: "UPSTREAM_TIMEOUT",
      message: "The air service timed out.",
    });
  });

  it("hides unknown error details behind a generic 500", async () => {
    mocks.getAirDigest.mockRejectedValue(new Error("internal secret"));

    const response = await GET(buildRequest("lat=28.61&lon=77.21"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL");
    expect(JSON.stringify(body)).not.toContain("internal secret");
  });
});
