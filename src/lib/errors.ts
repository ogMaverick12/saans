/**
 * Stable error codes shared by the API layer, the LLM layer and the UI.
 */
export const APP_ERROR_CODES = [
  "VALIDATION_FAILED",
  "RATE_LIMITED",
  "UPSTREAM_BLOCKED",
  "UPSTREAM_TIMEOUT",
  "UPSTREAM_FAILED",
  "LLM_NOT_CONFIGURED",
  "LLM_UNAVAILABLE",
  "LLM_BAD_OUTPUT",
  "INTERNAL",
] as const;

/**
 * One of the application's stable error codes.
 */
export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

/**
 * Application error that carries a stable code and a message safe to show a user.
 */
export class AppError extends Error {
  readonly code: AppErrorCode;

  readonly safeMessage: string;

  /**
   * Creates an application error from a stable code and a user-safe message.
   */
  constructor(code: AppErrorCode, safeMessage: string) {
    super(safeMessage);
    this.name = "AppError";
    this.code = code;
    this.safeMessage = safeMessage;
  }
}
