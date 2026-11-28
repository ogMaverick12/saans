import { getLlmEnv, type LlmEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import {
  buildBaseReport,
  buildClientEntries,
  probeEntries,
  type HealthClientEntry,
  type HealthClientName,
  type HealthClientReport,
} from "@/lib/api/health-clients";

const PROBE_CACHE_MS = 60_000;

/**
 * Health report for every language-model client.
 */
export interface HealthReport {
  clients: Record<HealthClientName, HealthClientReport>;
  probed: boolean;
}

/**
 * Replaceable dependencies for health checks; tests inject fakes.
 */
export interface HealthDependencies {
  readEnv?: () => LlmEnv | null;
  createClients?: (env: LlmEnv) => HealthClientEntry[];
  now?: () => number;
}

/**
 * Probe options for the health endpoint.
 */
export interface HealthCheckOptions {
  probe: boolean;
}

interface ProbeCacheEntry {
  report: HealthReport;
  expiresAt: number;
}

let probeCache: ProbeCacheEntry | null = null;

/**
 * Reads LLM settings, treating an unconfigured environment as null.
 */
function readConfiguredEnv(): LlmEnv | null {
  try {
    return getLlmEnv();
  } catch (error) {
    if (error instanceof AppError && error.code === "LLM_NOT_CONFIGURED") {
      return null;
    }
    throw error;
  }
}

/**
 * Returns a cached probe report when probing is enabled and the cache is warm.
 */
function cachedProbeReport(
  probe: boolean,
  now: () => number,
): HealthReport | null {
  if (!probe || probeCache === null) {
    return null;
  }
  return probeCache.expiresAt > now() ? probeCache.report : null;
}

/**
 * Builds the configured client entries, or none when no provider is set.
 */
function configuredEntries(
  env: LlmEnv | null,
  createClients: (env: LlmEnv) => HealthClientEntry[],
): HealthClientEntry[] {
  return env === null ? [] : createClients(env);
}

/**
 * Probes every entry, caches the report and returns it.
 */
async function probeReport(
  entries: readonly HealthClientEntry[],
  now: () => number,
): Promise<HealthReport> {
  const report: HealthReport = {
    clients: await probeEntries(entries),
    probed: true,
  };
  probeCache = { report, expiresAt: now() + PROBE_CACHE_MS };
  return report;
}

/**
 * Reports client configuration and optionally probes each configured client.
 */
export async function checkHealth(
  { probe }: HealthCheckOptions,
  deps: HealthDependencies = {},
): Promise<HealthReport> {
  const readEnv = deps.readEnv ?? readConfiguredEnv;
  const createClients = deps.createClients ?? buildClientEntries;
  const now = deps.now ?? Date.now;
  const cached = cachedProbeReport(probe, now);

  if (cached !== null) {
    return cached;
  }

  const entries = configuredEntries(readEnv(), createClients);
  if (!probe) {
    return { clients: buildBaseReport(entries), probed: false };
  }
  return probeReport(entries, now);
}

/**
 * Clears the cached probe report; intended for tests.
 */
export function resetHealthProbeCache(): void {
  probeCache = null;
}
