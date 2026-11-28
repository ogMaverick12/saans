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

export interface ApiGuardOptions<TInput, TOutput> {
  schema: ZodType<TInput>;
  handler: (input: TInput) => TOutput | Promise<TOutput>;
  rateLimiter: RateLimiter;
  cacheControl?: string;
}

/**
 * Returns the rate-limit failure response, or null when the request may proceed.
 */
function checkRateLimit(
  request: Request,
  rateLimiter: RateLimiter,
  cacheControl: string,
): Response | null {
  const limit = rateLimiter.check(getClientIp(request.headers));
  if (limit.allowed) {
    return null;
  }
  return failure("RATE_LIMITED", RATE_LIMIT_MESSAGE, cacheControl, {
    "Retry-After": String(limit.retryAfterSeconds),
  });
}

/**
 * Reads and validates the request input, returning a failure response or parsed data.
 */
async function parseRequest<TInput>(
  request: Request,
  schema: ZodType<TInput>,
  cacheControl: string,
): Promise<{ ok: true; value: TInput } | { ok: false; response: Response }> {
  const input = await readInput(request);
  if (!input.ok) {
    return {
      ok: false,
      response: failure("VALIDATION_FAILED", input.message, cacheControl),
    };
  }

  const parsed = schema.safeParse(input.value);
  if (!parsed.success) {
    return {
      ok: false,
      response: failure(
        "VALIDATION_FAILED",
        formatIssues(parsed.error),
        cacheControl,
      ),
    };
  }

  return { ok: true, value: parsed.data };
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
      const limited = checkRateLimit(request, rateLimiter, cacheControl);
      if (limited !== null) {
        return limited;
      }

      const parsed = await parseRequest(request, schema, cacheControl);
      if (!parsed.ok) {
        return parsed.response;
      }

      const data = await handler(parsed.value);
      return jsonResponse({ ok: true, data }, 200, cacheControl);
    } catch (error) {
      return errorResponse(error, request, cacheControl);
    }
  };
}
