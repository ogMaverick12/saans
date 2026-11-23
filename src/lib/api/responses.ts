import { AppError, type AppErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Cache policy for responses that must not be stored.
 */
export const NO_STORE_CACHE_CONTROL = "no-store";

/**
 * Cache policy for read-only place and air responses.
 */
export const PRIVATE_CACHE_CONTROL = "private, max-age=300";

/**
 * Fallback Retry-After value when an error does not carry a delay.
 */
export const DEFAULT_RETRY_AFTER_SECONDS = 60;

/**
 * Message shown when an unexpected error reaches the API boundary.
 */
export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

const STATUS_BY_CODE: Readonly<Record<AppErrorCode, number>> = {
  VALIDATION_FAILED: 400,
  RATE_LIMITED: 429,
  UPSTREAM_BLOCKED: 502,
  UPSTREAM_TIMEOUT: 502,
  UPSTREAM_FAILED: 502,
  LLM_NOT_CONFIGURED: 503,
  LLM_UNAVAILABLE: 503,
  LLM_BAD_OUTPUT: 502,
  INTERNAL: 500,
};

/**
 * Successful API response envelope.
 */
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

/**
 * Failed API response envelope.
 */
export interface ApiFailure {
  ok: false;
  error: {
    code: AppErrorCode;
    message: string;
  };
}

/**
 * Envelope returned by every API route.
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/**
 * Builds a JSON response with the route's cache policy.
 */
export function jsonResponse(
  body: ApiResponse<unknown>,
  status: number,
  cacheControl: string,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cacheControl,
      ...extraHeaders,
    },
  });
}

/**
 * Builds a failed response for an application error code.
 */
export function failure(
  code: AppErrorCode,
  message: string,
  cacheControl: string,
  extraHeaders: Record<string, string> = {},
): Response {
  return jsonResponse(
    { ok: false, error: { code, message } },
    STATUS_BY_CODE[code],
    cacheControl,
    extraHeaders,
  );
}

/**
 * Maps a thrown error to a safe response, logging unknown errors without bodies.
 */
export function errorResponse(
  error: unknown,
  request: Request,
  cacheControl: string,
): Response {
  if (error instanceof AppError) {
    const extraHeaders: Record<string, string> = {};
    if (error.code === "RATE_LIMITED") {
      extraHeaders["Retry-After"] = String(DEFAULT_RETRY_AFTER_SECONDS);
    }
    return failure(error.code, error.safeMessage, cacheControl, extraHeaders);
  }

  logger.error("Unhandled API error", {
    method: request.method,
    path: new URL(request.url).pathname,
    errorName: error instanceof Error ? error.name : "Unknown",
  });
  return failure("INTERNAL", GENERIC_ERROR_MESSAGE, cacheControl);
}
