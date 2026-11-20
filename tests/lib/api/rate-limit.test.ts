import { describe, expect, it } from "vitest";
import { apiRateLimiter } from "@/lib/api/rate-limit";
import { RATE_LIMIT_PER_MINUTE } from "@/lib/config";

describe("apiRateLimiter", () => {
  it("allows requests up to the configured per-minute limit", () => {
    const key = `test-${Date.now()}`;

    for (let request = 0; request < RATE_LIMIT_PER_MINUTE; request += 1) {
      expect(apiRateLimiter.check(key).allowed).toBe(true);
    }

    expect(apiRateLimiter.check(key)).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
  });

  it("keeps counters separate for each client", () => {
    const first = `test-a-${Date.now()}`;
    const second = `test-b-${Date.now()}`;

    for (let request = 0; request < RATE_LIMIT_PER_MINUTE; request += 1) {
      apiRateLimiter.check(first);
    }

    expect(apiRateLimiter.check(first).allowed).toBe(false);
    expect(apiRateLimiter.check(second).allowed).toBe(true);
  });
});
