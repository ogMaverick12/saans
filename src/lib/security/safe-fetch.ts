import { isAbortError } from "@/lib/abort";
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
 * Runs fetch with a hard timeout and rejects when the signal aborts.
 */
async function fetchWithTimeout(
  target: URL,
  init: RequestInit,
  timeoutMs: number,
  fetchImpl: FetchLike,
): Promise<Response> {
  const signal = AbortSignal.timeout(timeoutMs);
  return Promise.race([
    fetchImpl(target, { ...init, signal }),
    rejectOnAbort(signal),
  ]);
}

/**
 * Turns a non-2xx response into a safe upstream error.
 */
function assertOkResponse(response: Response): Response {
  if (!response.ok) {
    throw new AppError("UPSTREAM_FAILED", FAILED_MESSAGE);
  }
  return response;
}

/**
 * Maps any fetch failure to a safe timeout or upstream error.
 */
function throwSafeFetchError(error: unknown): never {
  if (error instanceof AppError) {
    throw error;
  }
  if (isAbortError(error)) {
    throw new AppError("UPSTREAM_TIMEOUT", TIMEOUT_MESSAGE);
  }
  throw new AppError("UPSTREAM_FAILED", FAILED_MESSAGE);
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

  try {
    const response = await fetchWithTimeout(target, init, timeoutMs, fetchImpl);
    return assertOkResponse(response);
  } catch (error) {
    throwSafeFetchError(error);
  }
}
