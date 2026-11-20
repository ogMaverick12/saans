import { RATE_LIMIT_PER_MINUTE } from "@/lib/config";
import { createRateLimiter } from "@/lib/security/rate-limit";

const MILLISECONDS_PER_MINUTE = 60_000;

/**
 * Shared per-IP limiter used by every API route.
 */
export const apiRateLimiter = createRateLimiter({
  limit: RATE_LIMIT_PER_MINUTE,
  windowMs: MILLISECONDS_PER_MINUTE,
});
