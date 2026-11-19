import { afterEach, describe, expect, it, vi } from "vitest";
import { LLM_TIMEOUT_MS } from "@/lib/config";
import { AppError } from "@/lib/errors";
import type { LlmClient } from "@/lib/llm/client";
import { generateStructured } from "@/lib/llm/generate";
import { PlanSchema } from "@/lib/llm/plan-schema";
import { FakeLlmClient, VALID_PLAN } from "./test-data";

const PROMPT = { system: "system rules", user: "write a plan" };
const MAX_OUTPUT_TOKENS = 512;

/**
 * Builds generation options for one fake client.
 */
function options(client: LlmClient) {
  return {
    client,
    schema: PlanSchema,
    prompt: PROMPT,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("generateStructured", () => {
  it("returns a valid plan from the first reply", async () => {
    const client = new FakeLlmClient([JSON.stringify(VALID_PLAN)]);

    const plan = await generateStructured(options(client));

    expect(plan).toEqual(VALID_PLAN);
    expect(client.requests).toHaveLength(1);
    expect(client.requests[0]).toEqual({
      ...PROMPT,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
  });

  it("retries once with the JSON error summary after bad JSON", async () => {
    const client = new FakeLlmClient(["not json", JSON.stringify(VALID_PLAN)]);

    const plan = await generateStructured(options(client));

    expect(plan).toEqual(VALID_PLAN);
    expect(client.requests).toHaveLength(2);
    expect(client.requests[1]?.user).toContain(PROMPT.user);
    expect(client.requests[1]?.user).toContain(
      "Your previous reply failed validation",
    );
    expect(client.requests[1]?.user).toContain("The reply was not valid JSON.");
    expect(client.requests[1]?.system).toBe(PROMPT.system);
    expect(client.requests[1]?.maxOutputTokens).toBe(MAX_OUTPUT_TOKENS);
  });

  it("retries once with the schema summary and never echoes the reply", async () => {
    const invalid = JSON.stringify({
      ...VALID_PLAN,
      dailyRoutine: [],
      secret: "do-not-echo",
    });
    const client = new FakeLlmClient([invalid, JSON.stringify(VALID_PLAN)]);

    await expect(generateStructured(options(client))).resolves.toEqual(
      VALID_PLAN,
    );

    const retry = client.requests[1]?.user ?? "";
    expect(retry).toContain("dailyRoutine");
    expect(retry).not.toContain("do-not-echo");
  });

  it("throws LLM_BAD_OUTPUT after two invalid replies", async () => {
    const client = new FakeLlmClient(["{}", "still not json"]);

    await expect(generateStructured(options(client))).rejects.toMatchObject({
      code: "LLM_BAD_OUTPUT",
    });
    expect(client.requests).toHaveLength(2);
  });

  it("does not retry a failing provider", async () => {
    const client = new FakeLlmClient([new AppError("LLM_UNAVAILABLE", "down")]);

    await expect(generateStructured(options(client))).rejects.toMatchObject({
      code: "LLM_UNAVAILABLE",
    });
    expect(client.requests).toHaveLength(1);
  });

  it("fails with LLM_UNAVAILABLE when the client exceeds the timeout", async () => {
    vi.useFakeTimers();
    const client: LlmClient = {
      complete: () => new Promise<string>(() => {}),
    };

    const pending = generateStructured(options(client));
    const assertion = expect(pending).rejects.toMatchObject({
      code: "LLM_UNAVAILABLE",
    });
    await vi.advanceTimersByTimeAsync(LLM_TIMEOUT_MS);
    await assertion;
  });
});
