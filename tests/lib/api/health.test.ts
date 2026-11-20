import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkHealth, resetHealthProbeCache } from "@/lib/api/health";
import {
  dependencies,
  entry,
  FULL_ENV,
  GEMINI_ENV,
} from "./health-test-helpers";

describe("checkHealth configuration", () => {
  beforeEach(() => {
    resetHealthProbeCache();
  });

  it("reports every client as missing when nothing is configured", async () => {
    const createClients = vi.fn();
    const report = await checkHealth(
      { probe: false },
      { readEnv: () => null, createClients },
    );

    expect(report).toEqual({
      probed: false,
      clients: {
        "gemini-primary": { status: "missing" },
        "gemini-fallback": { status: "missing" },
        openrouter: { status: "missing" },
      },
    });
    expect(createClients).not.toHaveBeenCalled();
  });

  it("marks Gemini clients configured and OpenRouter missing", async () => {
    const report = await checkHealth(
      { probe: false },
      dependencies(GEMINI_ENV, [
        entry("gemini-primary"),
        entry("gemini-fallback"),
      ]),
    );

    expect(report.clients["gemini-primary"].status).toBe("configured");
    expect(report.clients["gemini-fallback"].status).toBe("configured");
    expect(report.clients.openrouter.status).toBe("missing");
  });

  it("marks every client configured when all credentials exist", async () => {
    const report = await checkHealth(
      { probe: false },
      dependencies(FULL_ENV, [
        entry("gemini-primary"),
        entry("gemini-fallback"),
        entry("openrouter"),
      ]),
    );

    expect(Object.values(report.clients).map(({ status }) => status)).toEqual([
      "configured",
      "configured",
      "configured",
    ]);
  });
});

describe("checkHealth probe cache", () => {
  beforeEach(() => {
    resetHealthProbeCache();
  });

  it("caches probe results for sixty seconds", async () => {
    let currentMs = 1_000;
    const now = () => currentMs;
    const createClients = vi.fn(() => [entry("gemini-primary")]);
    const deps = {
      readEnv: () => GEMINI_ENV,
      createClients,
      now,
    };

    const first = await checkHealth({ probe: true }, deps);
    currentMs += 30_000;
    const cached = await checkHealth({ probe: true }, deps);

    expect(cached).toBe(first);
    expect(createClients).toHaveBeenCalledTimes(1);

    currentMs += 30_000;
    const refreshed = await checkHealth({ probe: true }, deps);

    expect(refreshed).not.toBe(first);
    expect(createClients).toHaveBeenCalledTimes(2);
  });

  it("does not use a cached probe for a plain status check", async () => {
    const deps = dependencies(GEMINI_ENV, [entry("gemini-primary")]);

    await checkHealth({ probe: true }, deps);
    const report = await checkHealth({ probe: false }, deps);

    expect(report.probed).toBe(false);
    expect(report.clients["gemini-primary"].status).toBe("configured");
  });
});
