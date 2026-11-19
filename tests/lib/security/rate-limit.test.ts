import { describe, expect, it } from "vitest";
import { RATE_LIMIT_MAX_KEYS } from "@/lib/config";
import { createRateLimiter } from "@/lib/security/rate-limit";

interface FakeClock {
  now: () => number;
  advance: (milliseconds: number) => void;
}

/**
 * Creates a controllable clock for the sliding-window tests.
 */
function createFakeClock(startMs = 0): FakeClock {
  let currentMs = startMs;
  return {
    now: () => currentMs,
    advance: (milliseconds: number) => {
      currentMs += milliseconds;
    },
  };
}

describe("createRateLimiter", () => {
  it("allows requests up to the limit, then reports a retry delay", () => {
    const clock = createFakeClock();
    const limiter = createRateLimiter({
      limit: 2,
      windowMs: 60_000,
      now: clock.now,
    });

    expect(limiter.check("client-a")).toEqual({
      allowed: true,
      retryAfterSeconds: 0,
    });
    expect(limiter.check("client-a")).toEqual({
      allowed: true,
      retryAfterSeconds: 0,
    });
    expect(limiter.check("client-a")).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
  });

  it("keeps counters separate for each key", () => {
    const clock = createFakeClock();
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 60_000,
      now: clock.now,
    });

    expect(limiter.check("client-a").allowed).toBe(true);
    expect(limiter.check("client-a").allowed).toBe(false);
    expect(limiter.check("client-b").allowed).toBe(true);
  });

  it("lets a key through once the window has passed", () => {
    const clock = createFakeClock(1_000);
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 1_000,
      now: clock.now,
    });

    expect(limiter.check("client-a").allowed).toBe(true);
    expect(limiter.check("client-a")).toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });

    clock.advance(500);
    expect(limiter.check("client-a")).toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });

    clock.advance(500);
    expect(limiter.check("client-a").allowed).toBe(true);
  });

  it("caps the number of tracked keys and evicts the oldest", () => {
    const clock = createFakeClock();
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 60_000,
      now: clock.now,
    });

    for (let index = 0; index < RATE_LIMIT_MAX_KEYS; index += 1) {
      expect(limiter.check(`client-${index}`).allowed).toBe(true);
    }

    expect(limiter.check("overflow-client").allowed).toBe(true);
    expect(limiter.check("client-0").allowed).toBe(true);
  });
});
