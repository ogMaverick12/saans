import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  getLlmEnv: vi.fn(),
}));

vi.mock("@/lib/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config")>();
  return { ...actual, getLlmEnv: mocks.getLlmEnv };
});

import { checkHealth, resetHealthProbeCache } from "@/lib/api/health";

describe("checkHealth default environment", () => {
  beforeEach(() => {
    resetHealthProbeCache();
    mocks.getLlmEnv.mockReset();
  });

  it("treats an unconfigured environment as no clients", async () => {
    mocks.getLlmEnv.mockImplementation(() => {
      throw new AppError(
        "LLM_NOT_CONFIGURED",
        "No language model is configured.",
      );
    });

    const report = await checkHealth({ probe: false });
    const statuses = Object.values(report.clients).map(({ status }) => status);

    expect(statuses).toEqual(["missing", "missing", "missing"]);
  });

  it("rethrows unexpected environment failures", async () => {
    mocks.getLlmEnv.mockImplementation(() => {
      throw new AppError("UPSTREAM_FAILED", "Upstream failed.");
    });

    await expect(checkHealth({ probe: false })).rejects.toMatchObject({
      code: "UPSTREAM_FAILED",
    });
  });
});
