import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_GEMINI_FALLBACK_MODEL,
  DEFAULT_GEMINI_MODEL,
  ENV_VAR_NAMES,
} from "@/lib/config";
import { getLlmEnv } from "@/lib/env";

const MANAGED_NAMES = Object.values(ENV_VAR_NAMES);
const ORIGINAL_ENV = new Map(
  MANAGED_NAMES.map((name) => [name, process.env[name]]),
);

/**
 * Restores every managed environment variable to its value before the suite.
 */
function restoreOriginalEnv(): void {
  for (const [name, value] of ORIGINAL_ENV) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}

beforeEach(() => {
  for (const name of MANAGED_NAMES) {
    delete process.env[name];
  }
});

afterAll(() => {
  restoreOriginalEnv();
});

describe("getLlmEnv", () => {
  it("reads trimmed Gemini and OpenRouter settings", () => {
    process.env[ENV_VAR_NAMES.geminiApiKey] = "  gemini-key  ";
    process.env[ENV_VAR_NAMES.geminiModel] = " gemini-primary ";
    process.env[ENV_VAR_NAMES.geminiFallbackModel] = "gemini-fallback";
    process.env[ENV_VAR_NAMES.openRouterApiKey] = " openrouter-key ";
    process.env[ENV_VAR_NAMES.openRouterModel] = " openrouter-model ";

    expect(getLlmEnv()).toEqual({
      geminiApiKey: "gemini-key",
      geminiModel: "gemini-primary",
      geminiFallbackModel: "gemini-fallback",
      openRouterApiKey: "openrouter-key",
      openRouterModel: "openrouter-model",
    });
  });

  it("treats blank values as unset and applies the Gemini model defaults", () => {
    process.env[ENV_VAR_NAMES.geminiApiKey] = " gemini-key ";
    process.env[ENV_VAR_NAMES.geminiModel] = "   ";
    process.env[ENV_VAR_NAMES.geminiFallbackModel] = "";
    process.env[ENV_VAR_NAMES.openRouterApiKey] = "  ";
    process.env[ENV_VAR_NAMES.openRouterModel] = "";

    expect(getLlmEnv()).toEqual({
      geminiApiKey: "gemini-key",
      geminiModel: DEFAULT_GEMINI_MODEL,
      geminiFallbackModel: DEFAULT_GEMINI_FALLBACK_MODEL,
      openRouterApiKey: null,
      openRouterModel: null,
    });
  });

  it("accepts an OpenRouter key and model without a Gemini key", () => {
    process.env[ENV_VAR_NAMES.openRouterApiKey] = "openrouter-key";
    process.env[ENV_VAR_NAMES.openRouterModel] = "openrouter-model";

    const env = getLlmEnv();

    expect(env.geminiApiKey).toBeNull();
    expect(env.geminiModel).toBe(DEFAULT_GEMINI_MODEL);
    expect(env.geminiFallbackModel).toBe(DEFAULT_GEMINI_FALLBACK_MODEL);
  });

  it.each([
    ["no settings", {}],
    [
      "whitespace-only settings",
      {
        [ENV_VAR_NAMES.geminiApiKey]: "   ",
        [ENV_VAR_NAMES.openRouterApiKey]: "   ",
        [ENV_VAR_NAMES.openRouterModel]: "   ",
      },
    ],
    [
      "an OpenRouter key without a model",
      {
        [ENV_VAR_NAMES.openRouterApiKey]: "openrouter-key",
      },
    ],
    [
      "an OpenRouter model without a key",
      {
        [ENV_VAR_NAMES.openRouterModel]: "openrouter-model",
      },
    ],
  ])("throws LLM_NOT_CONFIGURED with %s", (_label, settings) => {
    for (const [name, value] of Object.entries(settings)) {
      process.env[name] = value;
    }

    let caught: unknown;
    try {
      getLlmEnv();
    } catch (error) {
      caught = error;
    }

    expect(caught).toMatchObject({ code: "LLM_NOT_CONFIGURED" });
  });
});
