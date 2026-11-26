import {
  DEFAULT_GEMINI_FALLBACK_MODEL,
  DEFAULT_GEMINI_MODEL,
  ENV_VAR_NAMES,
  type EnvVarName,
} from "@/lib/config";
import { AppError } from "@/lib/errors";

const NOT_CONFIGURED_MESSAGE =
  "The language model is not configured. Add a Gemini or OpenRouter key.";

/**
 * Language-model settings read from the environment; null means unset.
 */
export interface LlmEnv {
  geminiApiKey: string | null;
  geminiModel: string;
  geminiFallbackModel: string;
  openRouterApiKey: string | null;
  openRouterModel: string | null;
}

/**
 * Reads one environment variable, treating empty or whitespace-only values as unset.
 */
function readEnv(name: EnvVarName): string | null {
  const value = process.env[name]?.trim();
  return value === undefined || value === "" ? null : value;
}

/**
 * Reads the language-model settings and applies the Gemini model defaults.
 */
export function getLlmEnv(): LlmEnv {
  const env: LlmEnv = {
    geminiApiKey: readEnv(ENV_VAR_NAMES.geminiApiKey),
    geminiModel: readEnv(ENV_VAR_NAMES.geminiModel) ?? DEFAULT_GEMINI_MODEL,
    geminiFallbackModel:
      readEnv(ENV_VAR_NAMES.geminiFallbackModel) ??
      DEFAULT_GEMINI_FALLBACK_MODEL,
    openRouterApiKey: readEnv(ENV_VAR_NAMES.openRouterApiKey),
    openRouterModel: readEnv(ENV_VAR_NAMES.openRouterModel),
  };
  const hasGemini = env.geminiApiKey !== null;
  const hasOpenRouter =
    env.openRouterApiKey !== null && env.openRouterModel !== null;
  if (!hasGemini && !hasOpenRouter) {
    throw new AppError("LLM_NOT_CONFIGURED", NOT_CONFIGURED_MESSAGE);
  }
  return env;
}
