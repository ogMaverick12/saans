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
 * Reports client configuration and optionally probes each configured client.
 */
export async function checkHealth(
  { probe }: HealthCheckOptions,
  deps: HealthDependencies = {},
): Promise<HealthReport> {
  const readEnv = deps.readEnv ?? readConfiguredEnv;
  const createClients = deps.createClients ?? buildClientEntries;
  const now = deps.now ?? Date.now;

  if (probe && probeCache !== null && probeCache.expiresAt > now()) {
    return probeCache.report;
  }

  const env = readEnv();
  const entries = env === null ? [] : createClients(env);
  if (!probe) {
    return { clients: buildBaseReport(entries), probed: false };
  }

  const report: HealthReport = {
    clients: await probeEntries(entries),
    probed: true,
  };
  probeCache = { report, expiresAt: now() + PROBE_CACHE_MS };
  return report;
}

/**
 * Clears the cached probe report; intended for tests.
 */
export function resetHealthProbeCache(): void {
  probeCache = null;
}
