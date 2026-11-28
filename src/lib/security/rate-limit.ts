import { RATE_LIMIT_MAX_KEYS } from "@/lib/config";

const MILLISECONDS_PER_SECOND = 1_000;

export interface RateLimiterOptions {
  /** Maximum requests allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Clock source, replaceable in tests. */
  now?: () => number;
}

export interface RateLimitResult {
  /** Whether the request may proceed. */
  allowed: boolean;
  /** Seconds until the next request is allowed; zero when allowed. */
  retryAfterSeconds: number;
}

/**
 * Rate limiter that keys counters by an opaque client identifier.
 */
export interface RateLimiter {
  /** Records a request for the key and decides whether it is allowed. */
  check(key: string): RateLimitResult;
}

type RequestLog = Map<string, number[]>;

/**
 * Removes keys whose newest request is outside the current window.
 */
function pruneStaleKeys(requestLog: RequestLog, windowStart: number): void {
  for (const [key, timestamps] of requestLog) {
    const newestTimestamp = timestamps[timestamps.length - 1];
    if (newestTimestamp === undefined || newestTimestamp <= windowStart) {
      requestLog.delete(key);
    }
  }
}

/**
 * Deletes the oldest inserted keys until the log is below its size cap.
 */
function makeRoom(requestLog: RequestLog): void {
  while (requestLog.size >= RATE_LIMIT_MAX_KEYS) {
    const oldestKey = requestLog.keys().next().value;
    if (oldestKey === undefined) {
      return;
    }
    requestLog.delete(oldestKey);
  }
}

/**
 * Keeps the request log bounded before a new key is stored.
 */
function ensureCapacity(
  requestLog: RequestLog,
  key: string,
  windowStart: number,
): void {
  if (requestLog.has(key) || requestLog.size < RATE_LIMIT_MAX_KEYS) {
    return;
  }
  pruneStaleKeys(requestLog, windowStart);
  makeRoom(requestLog);
}

/**
 * Returns a key's request timestamps that fall inside the current window.
 */
function recentTimestamps(
  requestLog: RequestLog,
  key: string,
  windowStart: number,
): number[] {
  return (requestLog.get(key) ?? []).filter(
    (timestamp) => timestamp > windowStart,
  );
}

/**
 * Builds the denial result for a key that has reached the request limit.
 */
function denialResult(
  oldestTimestamp: number | undefined,
  currentTime: number,
  windowMs: number,
): RateLimitResult {
  const retryAfterMs =
    oldestTimestamp === undefined
      ? windowMs
      : oldestTimestamp + windowMs - currentTime;
  return {
    allowed: false,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil(retryAfterMs / MILLISECONDS_PER_SECOND),
    ),
  };
}

/**
 * Creates an in-memory sliding-window rate limiter with a bounded key count.
 */
export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: RateLimiterOptions): RateLimiter {
  const requestLog: RequestLog = new Map();

  return {
    check(key: string): RateLimitResult {
      const currentTime = now();
      const windowStart = currentTime - windowMs;
      ensureCapacity(requestLog, key, windowStart);

      const timestamps = recentTimestamps(requestLog, key, windowStart);
      if (timestamps.length >= limit) {
        return denialResult(timestamps[0], currentTime, windowMs);
      }

      timestamps.push(currentTime);
      requestLog.set(key, timestamps);
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}
