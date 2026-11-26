import type { LlmEnv } from "@/lib/env";
import { AppError, type AppErrorCode } from "@/lib/errors";
import type { LlmClient } from "@/lib/llm/client";
import { createGeminiClient } from "@/lib/llm/gemini";
import { createOpenRouterClient } from "@/lib/llm/openrouter";

const PROBE_MAX_OUTPUT_TOKENS = 20;
const PROBE_SYSTEM = "You are a health check. Reply with OK.";
const PROBE_USER = "Reply with OK";
const FALLBACK_FAILURE_CODE: AppErrorCode = "UPSTREAM_FAILED";

/**
 * Names of the language-model clients reported by the health endpoint.
 */
export const HEALTH_CLIENT_NAMES = [
  "gemini-primary",
  "gemini-fallback",
  "openrouter",
] as const;

/**
 * One language-model client name.
 */
export type HealthClientName = (typeof HEALTH_CLIENT_NAMES)[number];

/**
 * Status of one language-model client.
 */
export type HealthStatus = "configured" | "missing" | "ok" | "failed";

/**
 * Safe health report for one client; never includes keys or model names.
 */
export interface HealthClientReport {
  status: HealthStatus;
  code?: AppErrorCode;
}

/**
 * A configured client and the name it is reported under.
 */
export interface HealthClientEntry {
  name: HealthClientName;
  client: LlmClient;
}

/**
 * Creates one client per configured provider and model.
 */
export function buildClientEntries(env: LlmEnv): HealthClientEntry[] {
  const entries: HealthClientEntry[] = [];
  if (env.geminiApiKey !== null) {
    entries.push({
      name: "gemini-primary",
      client: createGeminiClient({
        apiKey: env.geminiApiKey,
        model: env.geminiModel,
      }),
    });
    entries.push({
      name: "gemini-fallback",
      client: createGeminiClient({
        apiKey: env.geminiApiKey,
        model: env.geminiFallbackModel,
      }),
    });
  }
  if (env.openRouterApiKey !== null && env.openRouterModel !== null) {
    entries.push({
      name: "openrouter",
      client: createOpenRouterClient({
        apiKey: env.openRouterApiKey,
        model: env.openRouterModel,
      }),
    });
  }
  return entries;
}

/**
 * Reports each client as configured when it has credentials.
 */
export function buildBaseReport(
  entries: readonly HealthClientEntry[],
): Record<HealthClientName, HealthClientReport> {
  const configured = new Set(entries.map(({ name }) => name));
  return {
    "gemini-primary": {
      status: configured.has("gemini-primary") ? "configured" : "missing",
    },
    "gemini-fallback": {
      status: configured.has("gemini-fallback") ? "configured" : "missing",
    },
    openrouter: {
      status: configured.has("openrouter") ? "configured" : "missing",
    },
  };
}

/**
 * Makes one tiny live call and maps any failure to a safe code.
 */
async function probeClient(
  entry: HealthClientEntry,
): Promise<HealthClientReport> {
  try {
    await entry.client.complete({
      system: PROBE_SYSTEM,
      user: PROBE_USER,
      maxOutputTokens: PROBE_MAX_OUTPUT_TOKENS,
    });
    return { status: "ok" };
  } catch (error) {
    return {
      status: "failed",
      code: error instanceof AppError ? error.code : FALLBACK_FAILURE_CODE,
    };
  }
}

/**
 * Probes every configured client in parallel and merges the results.
 */
export async function probeEntries(
  entries: readonly HealthClientEntry[],
): Promise<Record<HealthClientName, HealthClientReport>> {
  const results = await Promise.all(
    entries.map(async (entry) => ({
      name: entry.name,
      report: await probeClient(entry),
    })),
  );
  const probed = new Map(results.map(({ name, report }) => [name, report]));
  const base = buildBaseReport(entries);
  return {
    "gemini-primary": probed.get("gemini-primary") ?? base["gemini-primary"],
    "gemini-fallback": probed.get("gemini-fallback") ?? base["gemini-fallback"],
    openrouter: probed.get("openrouter") ?? base.openrouter,
  };
}
