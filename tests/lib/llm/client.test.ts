import { describe, expect, it } from "vitest";
import { LLM_TEMPERATURE, type LlmClient } from "@/lib/llm/client";

describe("LLM_TEMPERATURE", () => {
  it("stays low enough for consistent structured JSON", () => {
    expect(LLM_TEMPERATURE).toBeGreaterThan(0);
    expect(LLM_TEMPERATURE).toBeLessThanOrEqual(1);
  });
});

describe("LlmClient", () => {
  it("is implemented by a provider that returns raw JSON text", async () => {
    const client: LlmClient = {
      complete: async () => '{"answer":"ok"}',
    };

    await expect(
      client.complete({
        system: "rules",
        user: "question",
        maxOutputTokens: 8,
      }),
    ).resolves.toBe('{"answer":"ok"}');
  });
});
