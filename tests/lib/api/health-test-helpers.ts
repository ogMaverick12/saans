import { vi } from "vitest";
import type { HealthDependencies } from "@/lib/api/health";
import type { HealthClientEntry } from "@/lib/api/health-clients";
import type { LlmEnv } from "@/lib/env";
import { FakeLlmClient } from "../llm/test-data";

/**
 * Environment with Gemini credentials only.
 */
export const GEMINI_ENV: LlmEnv = {
  geminiApiKey: "test-gemini-key",
  geminiModel: "gemini-test-model",
  geminiFallbackModel: "gemini-fallback-model",
  openRouterApiKey: null,
  openRouterModel: null,
};

/**
 * Environment with every provider configured.
 */
export const FULL_ENV: LlmEnv = {
  ...GEMINI_ENV,
  openRouterApiKey: "test-openrouter-key",
  openRouterModel: "openrouter-test-model",
};

/**
 * Builds a configured entry backed by a fake client.
 */
export function entry(
  name: HealthClientEntry["name"],
  client = new FakeLlmClient(["OK"]),
): HealthClientEntry {
  return { name, client };
}

/**
 * Builds dependencies that read a fixed environment and fake clients.
 */
export function dependencies(
  env: LlmEnv | null,
  entries: HealthClientEntry[],
): HealthDependencies {
  return {
    readEnv: () => env,
    createClients: vi.fn(() => entries),
  };
}
