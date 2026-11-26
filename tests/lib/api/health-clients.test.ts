import { describe, expect, it } from "vitest";
import {
  buildBaseReport,
  buildClientEntries,
  probeEntries,
  type HealthClientEntry,
} from "@/lib/api/health-clients";
import type { LlmEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { FakeLlmClient } from "../llm/test-data";

const EMPTY_ENV: LlmEnv = {
  geminiApiKey: null,
  geminiModel: "gemini-test",
  geminiFallbackModel: "gemini-fallback-test",
  openRouterApiKey: null,
  openRouterModel: null,
};

const FULL_ENV: LlmEnv = {
  ...EMPTY_ENV,
  geminiApiKey: "test-gemini-key",
  openRouterApiKey: "test-openrouter-key",
  openRouterModel: "openrouter-test",
};

describe("buildClientEntries", () => {
  it("creates no clients without credentials", () => {
    expect(buildClientEntries(EMPTY_ENV)).toEqual([]);
  });

  it("creates primary and fallback Gemini clients from one key", () => {
    const entries = buildClientEntries({
      ...EMPTY_ENV,
      geminiApiKey: "test-gemini-key",
    });

    expect(entries.map(({ name }) => name)).toEqual([
      "gemini-primary",
      "gemini-fallback",
    ]);
  });

  it("adds OpenRouter only when both key and model exist", () => {
    const missingModel = buildClientEntries({
      ...EMPTY_ENV,
      openRouterApiKey: "test-openrouter-key",
    });
    const complete = buildClientEntries(FULL_ENV);

    expect(missingModel).toEqual([]);
    expect(complete.map(({ name }) => name)).toEqual([
      "gemini-primary",
      "gemini-fallback",
      "openrouter",
    ]);
  });
});

describe("buildBaseReport", () => {
  it("marks configured entries and leaves the rest missing", () => {
    const report = buildBaseReport([
      { name: "gemini-primary", client: new FakeLlmClient([]) },
    ]);

    expect(report).toEqual({
      "gemini-primary": { status: "configured" },
      "gemini-fallback": { status: "missing" },
      openrouter: { status: "missing" },
    });
  });
});

describe("probeEntries", () => {
  it("reports ok and safe failure codes for each probed client", async () => {
    const entries: HealthClientEntry[] = [
      { name: "gemini-primary", client: new FakeLlmClient(["OK"]) },
      {
        name: "gemini-fallback",
        client: new FakeLlmClient([new AppError("UPSTREAM_TIMEOUT", "slow")]),
      },
      {
        name: "openrouter",
        client: new FakeLlmClient([new Error("secret detail")]),
      },
    ];

    const report = await probeEntries(entries);

    expect(report["gemini-primary"]).toEqual({ status: "ok" });
    expect(report["gemini-fallback"]).toEqual({
      status: "failed",
      code: "UPSTREAM_TIMEOUT",
    });
    expect(report.openrouter).toEqual({
      status: "failed",
      code: "UPSTREAM_FAILED",
    });
    expect(JSON.stringify(report)).not.toContain("secret detail");
  });

  it("does not probe clients that are not configured", async () => {
    const report = await probeEntries([
      { name: "gemini-primary", client: new FakeLlmClient(["OK"]) },
    ]);

    expect(report["gemini-fallback"].status).toBe("missing");
    expect(report.openrouter.status).toBe("missing");
  });
});
