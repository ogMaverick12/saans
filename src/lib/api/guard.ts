import type { ZodType } from "zod";
import { getClientIp } from "@/lib/security/client-ip";
import type { RateLimiter } from "@/lib/security/rate-limit";
import { formatIssues, readInput } from "@/lib/api/input";
import {
  failure,
  errorResponse,
  jsonResponse,
  NO_STORE_CACHE_CONTROL,
} from "@/lib/api/responses";

const RATE_LIMIT_MESSAGE =
  "Too many requests. Please wait a moment and try again.";

/**
 * Options for one guarded API route.
 */
export interface ApiGuardOptions<TInput, TOutput> {
  schema: ZodType<TInput>;
  handler: (input: TInput) => TOutput | Promise<TOutput>;
  rateLimiter: RateLimiter;
  cacheControl?: string;
}

/**
 * Wraps a route handler with rate limiting, validation and safe envelopes.
 */
export function withApiGuard<TInput, TOutput>({
  schema,
  handler,
  rateLimiter,
  cacheControl = NO_STORE_CACHE_CONTROL,
}: ApiGuardOptions<TInput, TOutput>): (request: Request) => Promise<Response> {
  return async (request) => {
    try {
      const limit = rateLimiter.check(getClientIp(request.headers));
      if (!limit.allowed) {
        return failure("RATE_LIMITED", RATE_LIMIT_MESSAGE, cacheControl, {
          "Retry-After": String(limit.retryAfterSeconds),
        });
      }

      const input = await readInput(request);
      if (!input.ok) {
        return failure("VALIDATION_FAILED", input.message, cacheControl);
      }

      const parsed = schema.safeParse(input.value);
      if (!parsed.success) {
        return failure(
          "VALIDATION_FAILED",
          formatIssues(parsed.error),
          cacheControl,
        );
      }

      const data = await handler(parsed.data);
      return jsonResponse({ ok: true, data }, 200, cacheControl);
    } catch (error) {
      return errorResponse(error, request, cacheControl);
    }
  };
}
