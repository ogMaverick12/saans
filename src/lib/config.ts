/**
 * Hosts the server may call; every outbound request must match one of these.
 */
export const ALLOWED_HOSTS = [
  "geocoding-api.open-meteo.com",
  "air-quality-api.open-meteo.com",
  "api.open-meteo.com",
  "generativelanguage.googleapis.com",
  "openrouter.ai",
] as const;

/**
 * A hostname that outbound requests are permitted to reach.
 */
export type AllowedHost = (typeof ALLOWED_HOSTS)[number];

/**
 * Maximum time to wait for an air, weather or geocoding response.
 */
export const UPSTREAM_TIMEOUT_MS = 5_000;

/**
 * Maximum time to wait for a language-model response.
 */
export const LLM_TIMEOUT_MS = 25_000;

/**
 * How long upstream air and weather responses stay cached, in seconds.
 */
export const AIR_CACHE_SECONDS = 600;

/**
 * Maximum length of the optional free-text note, in characters.
 */
export const FREE_TEXT_MAX_CHARS = 200;

/**
 * Requests allowed per client IP per minute for every API route.
 */
export const RATE_LIMIT_PER_MINUTE = 20;

/**
 * Decimal places kept when rounding latitude and longitude.
 */
export const COORDINATE_DECIMALS = 2;

/**
 * Environment variable names read by the server; their values are never exported.
 */
export const ENV_VAR_NAMES = {
  geminiApiKey: "GEMINI_API_KEY",
  geminiModel: "GEMINI_MODEL",
  geminiFallbackModel: "GEMINI_FALLBACK_MODEL",
  openRouterApiKey: "OPENROUTER_API_KEY",
  openRouterModel: "OPENROUTER_MODEL",
} as const;

/**
 * One of the environment variable names the server understands.
 */
export type EnvVarName = (typeof ENV_VAR_NAMES)[keyof typeof ENV_VAR_NAMES];

/**
 * Default Gemini model when GEMINI_MODEL is unset; Flash-Lite has the highest free-tier usage.
 */
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

/**
 * Default Gemini fallback model when GEMINI_FALLBACK_MODEL is unset.
 */
export const DEFAULT_GEMINI_FALLBACK_MODEL = "gemini-3.8-flash";
