import { vi } from "vitest";
import { z } from "zod";
import type { RateLimiter } from "@/lib/security/rate-limit";

/**
 * Stable client IP used by guard tests.
 */
export const TEST_IP = "203.0.113.9";

/**
 * Small schema shared by guard tests.
 */
export const TEST_SCHEMA = z.object({ q: z.string().min(2) });

/**
 * Builds a limiter that always returns the supplied decision.
 */
export function createLimiter(
  allowed = true,
  retryAfterSeconds = 0,
): RateLimiter {
  return { check: vi.fn(() => ({ allowed, retryAfterSeconds })) };
}

/**
 * Builds a request with a stable client IP.
 */
export function buildRequest(
  path = "/api/test?q=Delhi",
  init?: RequestInit,
): Request {
  const headers = new Headers(init?.headers);
  headers.set("x-forwarded-for", TEST_IP);
  return new Request(new URL(path, "http://localhost"), {
    ...init,
    headers,
  });
}
