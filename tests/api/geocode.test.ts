import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  searchPlaces: vi.fn(),
  check: vi.fn(),
}));

vi.mock("@/lib/air/clients", () => ({ searchPlaces: mocks.searchPlaces }));
vi.mock("@/lib/api/rate-limit", () => ({
  apiRateLimiter: { check: mocks.check },
}));

import { GET } from "@/app/api/geocode/route";

const MATCHES = [
  {
    name: "Delhi",
    latitude: 28.61,
    longitude: 77.21,
    countryCode: "IN",
    country: "India",
    admin1: "Delhi",
  },
];

/**
 * Builds a geocode request with a stable client IP.
 */
function buildRequest(query: string): Request {
  return new Request(`http://localhost/api/geocode?${query}`, {
    headers: { "x-forwarded-for": "203.0.113.10" },
  });
}

describe("GET /api/geocode", () => {
  beforeEach(() => {
    mocks.searchPlaces.mockReset();
    mocks.check.mockReset();
    mocks.check.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
  });

  it("returns matching places with a private cache policy", async () => {
    mocks.searchPlaces.mockResolvedValue(MATCHES);

    const response = await GET(buildRequest("q=Delhi"));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, max-age=300");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: MATCHES,
    });
    expect(mocks.searchPlaces).toHaveBeenCalledWith("Delhi");
  });

  it("rejects a query shorter than two characters", async () => {
    const response = await GET(buildRequest("q=a"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.message).toContain("q:");
    expect(mocks.searchPlaces).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when the limiter blocks", async () => {
    mocks.check.mockReturnValue({ allowed: false, retryAfterSeconds: 12 });

    const response = await GET(buildRequest("q=Delhi"));

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("12");
    expect(mocks.searchPlaces).not.toHaveBeenCalled();
  });

  it("maps an AppError to its safe status and message", async () => {
    mocks.searchPlaces.mockRejectedValue(
      new AppError("UPSTREAM_BLOCKED", "That place service is blocked."),
    );

    const response = await GET(buildRequest("q=Delhi"));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toEqual({
      code: "UPSTREAM_BLOCKED",
      message: "That place service is blocked.",
    });
  });

  it("hides unknown error details behind a generic 500", async () => {
    mocks.searchPlaces.mockRejectedValue(new Error("internal secret"));

    const response = await GET(buildRequest("q=Delhi"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL");
    expect(JSON.stringify(body)).not.toContain("internal secret");
  });
});
