import { beforeEach, describe, expect, it } from "vitest";
import { checkHealth, resetHealthProbeCache } from "@/lib/api/health";
import { AppError } from "@/lib/errors";
import { FakeLlmClient } from "../llm/test-data";
import {
  dependencies,
  entry,
  FULL_ENV,
  GEMINI_ENV,
} from "./health-test-helpers";

describe("checkHealth probes", () => {
  beforeEach(() => {
    resetHealthProbeCache();
  });

  it("probes only configured clients with a tiny reply request", async () => {
    const okClient = new FakeLlmClient(["OK"]);
    const report = await checkHealth(
      { probe: true },
      dependencies(GEMINI_ENV, [entry("gemini-primary", okClient)]),
    );

    expect(report.probed).toBe(true);
    expect(report.clients["gemini-primary"]).toEqual({ status: "ok" });
    expect(report.clients["gemini-fallback"].status).toBe("missing");
    expect(report.clients.openrouter.status).toBe("missing");
    expect(okClient.requests).toEqual([
      {
        system: expect.stringContaining("health check"),
        user: "Reply with OK",
        maxOutputTokens: 20,
      },
    ]);
  });

  it("reports a safe failure code for each failed probe", async () => {
    const report = await checkHealth(
      { probe: true },
      dependencies(FULL_ENV, [
        entry(
          "gemini-primary",
          new FakeLlmClient([new AppError("UPSTREAM_TIMEOUT", "Timed out.")]),
        ),
        entry(
          "gemini-fallback",
          new FakeLlmClient([new Error("secret provider detail")]),
        ),
        entry("openrouter", new FakeLlmClient(["OK"])),
      ]),
    );

    expect(report.clients["gemini-primary"]).toEqual({
      status: "failed",
      code: "UPSTREAM_TIMEOUT",
    });
    expect(report.clients["gemini-fallback"]).toEqual({
      status: "failed",
      code: "UPSTREAM_FAILED",
    });
    expect(report.clients.openrouter).toEqual({ status: "ok" });
    expect(JSON.stringify(report)).not.toContain("secret provider detail");
  });

  it("never returns key or model values", async () => {
    const report = await checkHealth(
      { probe: true },
      dependencies(FULL_ENV, [
        entry("gemini-primary"),
        entry("gemini-fallback"),
        entry("openrouter"),
      ]),
    );
    const serialized = JSON.stringify(report);

    expect(serialized).not.toContain("test-gemini-key");
    expect(serialized).not.toContain("test-openrouter-key");
    expect(serialized).not.toContain("gemini-test-model");
    expect(serialized).not.toContain("openrouter-test-model");
  });
});
