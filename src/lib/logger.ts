/**
 * Severity levels emitted by the application logger.
 */
export type LogLevel = "info" | "warn" | "error";

/**
 * Primitive values that are safe to attach to a log entry.
 */
export type LogContextValue = string | number | boolean | null;

/**
 * Small, flat context attached to a log entry; never request bodies, profile answers or secrets.
 */
export type LogContext = Readonly<Record<string, LogContextValue>>;

/**
 * Structured JSON-lines logger; never pass request bodies, profile answers or secrets.
 */
export interface Logger {
  /** Writes an informational log entry. */
  info(message: string, context?: LogContext): void;
  /** Writes a warning log entry. */
  warn(message: string, context?: LogContext): void;
  /** Writes an error log entry. */
  error(message: string, context?: LogContext): void;
}

const MAX_CONTEXT_KEYS = 20;

/**
 * Checks that a runtime value is a primitive safe to log.
 */
function isLogContextValue(value: unknown): value is LogContextValue {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

/**
 * Drops non-primitive context values so an accidental object can never leak into the log.
 */
function toSafeContext(context: LogContext): Record<string, LogContextValue> {
  const safeEntries = Object.entries(context)
    .filter(([, value]) => isLogContextValue(value))
    .slice(0, MAX_CONTEXT_KEYS);
  return Object.fromEntries(safeEntries);
}

/**
 * Writes one JSON line to the console at the requested level.
 */
function emit(level: LogLevel, message: string, context: LogContext): void {
  const entry = {
    ...toSafeContext(context),
    time: new Date().toISOString(),
    level,
    message,
  };
  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}

/**
 * Shared logger that prints one JSON object per line.
 */
export const logger: Logger = {
  info: (message, context = {}) => emit("info", message, context),
  warn: (message, context = {}) => emit("warn", message, context),
  error: (message, context = {}) => emit("error", message, context),
};
