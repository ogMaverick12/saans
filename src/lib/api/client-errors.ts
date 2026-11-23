import type { AppErrorCode } from "@/lib/errors";

const GENERIC_CLIENT_MESSAGE = "Something went wrong. Please try again.";

/**
 * A stable client error code, including transport and parsing failures.
 */
export type ClientErrorCode = AppErrorCode | "NETWORK" | "INVALID_RESPONSE";

/**
 * An error raised by a browser API request with a message safe to show a user.
 */
export class ClientError extends Error {
  readonly code: ClientErrorCode;

  readonly safeMessage: string;

  /**
   * Creates a client error from a stable code and a user-safe message.
   */
  constructor(code: ClientErrorCode, safeMessage: string) {
    super(safeMessage);
    this.name = "ClientError";
    this.code = code;
    this.safeMessage = safeMessage;
  }
}

/**
 * Checks whether an unknown value is an abort error from fetch.
 */
export function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

/**
 * Returns the safe message for a client failure.
 */
export function toClientMessage(error: unknown): string {
  return error instanceof ClientError
    ? error.safeMessage
    : GENERIC_CLIENT_MESSAGE;
}

/**
 * The fetch signature the browser client accepts, so tests can inject a fake.
 */
export type ClientFetch = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

/**
 * Per-request options for the browser client.
 */
export interface ClientRequestOptions {
  signal?: AbortSignal;
  fetchImpl?: ClientFetch;
}
