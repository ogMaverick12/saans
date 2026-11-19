import { UPSTREAM_TIMEOUT_MS } from "@/lib/config";
import { AppError } from "@/lib/errors";
import { assertAllowedHost } from "@/lib/security/allowlist";

/**
 * Minimal fetch signature accepted by safeFetch so tests can supply a fake.
 */
export type FetchLike = (input: URL, init?: RequestInit) => Promise<Response>;

/**
 * Options for an allowlisted upstream request.
 */
export interface SafeFetchOptions {
  /** Timeout in milliseconds; defaults to UPSTREAM_TIMEOUT_MS. */
  timeoutMs?: number;
  /** Fetch implementation; defaults to the global fetch. */
  fetchImpl?: FetchLike;
}

const BLOCKED_MESSAGE =
  "The request was blocked because its destination is not allowed.";
const TIMEOUT_MESSAGE = "The upstream service took too long to respond.";
const FAILED_MESSAGE = "The upstream service returned an error.";

/**
 * Parses a URL string, failing with a safe error when it is not absolute.
 */
function parseUpstreamUrl(url: string | URL): URL {
  if (url instanceof URL) {
    return url;
  }
  try {
    return new URL(url);
  } catch {
    throw new AppError("UPSTREAM_BLOCKED", BLOCKED_MESSAGE);
  }
}

/**
 * Checks whether an unknown value is an abort error from fetch.
 */
function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

/**
 * Rejects when the signal aborts, so a fetch that ignores the signal still times out.
 */
function rejectOnAbort(signal: AbortSignal): Promise<never> {
  return new Promise<never>((_resolve, reject) => {
    signal.addEventListener(
      "abort",
      () => reject(new AppError("UPSTREAM_TIMEOUT", TIMEOUT_MESSAGE)),
      { once: true },
    );
  });
}

/**
 * Fetches an allowlisted HTTPS URL with a hard timeout and safe error mapping.
 */
export async function safeFetch(
  url: string | URL,
  init: RequestInit = {},
  { timeoutMs = UPSTREAM_TIMEOUT_MS, fetchImpl = fetch }: SafeFetchOptions = {},
): Promise<Response> {
  const target = parseUpstreamUrl(url);
  assertAllowedHost(target);

  const signal = AbortSignal.timeout(timeoutMs);
  try {
    const response = await Promise.race([
      fetchImpl(target, { ...init, signal }),
      rejectOnAbort(signal),
    ]);
    if (!response.ok) {
      throw new AppError("UPSTREAM_FAILED", FAILED_MESSAGE);
    }
    return response;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (isAbortError(error)) {
      throw new AppError("UPSTREAM_TIMEOUT", TIMEOUT_MESSAGE);
    }
    throw new AppError("UPSTREAM_FAILED", FAILED_MESSAGE);
  }
}
