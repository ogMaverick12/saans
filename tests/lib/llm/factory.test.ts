import { describe, expect, it, vi } from "vitest";
import type { LlmEnv } from "@/lib/env";
import { createLlmClient, FallbackLlmClient } from "@/lib/llm/factory";
import type { FetchLike } from "@/lib/security/safe-fetch";
import { FakeLlmClient, jsonResponse } from "./test-data";

const GEMINI_SUCCESS = {
  candidates: [{ content: { parts: [{ text: "gemini-ok" }] } }],
};
const OPENROUTER_SUCCESS = {
  choices: [{ message: { content: "openrouter-ok" } }],
};

/**
 * Builds a complete LLM environment with optional overrides.
 */
function buildEnv(overrides: Partial<LlmEnv> = {}): LlmEnv {
  return {
    geminiApiKey: "gemini-key",
    geminiModel: "gemini-primary",
    geminiFallbackModel: "gemini-fallback",
    openRouterApiKey: "openrouter-key",
    openRouterModel: "openrouter/model",
    ...overrides,
  };
}

/**
 * Creates a fetch that routes each provider URL to a configured response.
 */
function createProviderFetch() {
  return vi.fn<FetchLike>().mockImplementation(async (url) => {
    if (url.pathname.includes("gemini-primary")) {
      return jsonResponse({ error: "rate limited" }, 429);
    }
    if (url.pathname.includes("gemini-fallback")) {
      return jsonResponse({ error: "down" }, 503);
    }
    return jsonResponse(OPENROUTER_SUCCESS);
  });
}

const REQUEST = { system: "s", user: "u", maxOutputTokens: 10 };

describe("createLlmClient", () => {
  it("tries Gemini primary, Gemini fallback and then OpenRouter", async () => {
    const fetchImpl = createProviderFetch();
    const client = createLlmClient(buildEnv(), fetchImpl);

    await expect(client.complete(REQUEST)).resolves.toBe("openrouter-ok");
    expect(fetchImpl.mock.calls.map(([url]) => url.pathname)).toEqual([
      "/v1beta/models/gemini-primary:generateContent",
      "/v1beta/models/gemini-fallback:generateContent",
      "/api/v1/chat/completions",
    ]);
  });

  it("stops at the second provider when the first fails", async () => {
    const fetchImpl = vi.fn<FetchLike>().mockImplementation(async (url) => {
      if (url.pathname.includes("gemini-primary")) {
        return jsonResponse({ error: "not found" }, 404);
      }
      return jsonResponse(GEMINI_SUCCESS);
    });
    const client = createLlmClient(buildEnv(), fetchImpl);

    await expect(client.complete(REQUEST)).resolves.toBe("gemini-ok");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1]?.[0].pathname).toContain("gemini-fallback");
  });

  it("throws LLM_UNAVAILABLE when every provider fails", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValue(jsonResponse({ error: "down" }, 500));
    const client = createLlmClient(buildEnv(), fetchImpl);

    await expect(client.complete(REQUEST)).rejects.toMatchObject({
      code: "LLM_UNAVAILABLE",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("uses only Gemini when OpenRouter is not configured", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValue(jsonResponse(GEMINI_SUCCESS));
    const client = createLlmClient(
      buildEnv({ openRouterApiKey: null, openRouterModel: null }),
      fetchImpl,
    );

    await expect(client.complete(REQUEST)).resolves.toBe("gemini-ok");
    expect(
      fetchImpl.mock.calls.some(([url]) =>
        url.pathname.includes("chat/completions"),
      ),
    ).toBe(false);
  });

  it.each([
    [
      "a key without a model",
      { openRouterApiKey: "key", openRouterModel: null },
    ],
    ["a model without a key", { openRouterApiKey: null, openRouterModel: "m" }],
  ])("does not use OpenRouter with %s", async (_label, overrides) => {
    const fetchImpl = vi.fn<FetchLike>();
    const client = createLlmClient(
      buildEnv({ geminiApiKey: null, ...overrides }),
      fetchImpl,
    );

    await expect(client.complete(REQUEST)).rejects.toMatchObject({
      code: "LLM_UNAVAILABLE",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("FallbackLlmClient", () => {
  it("returns the first success and leaves later clients untouched", async () => {
    const first = new FakeLlmClient(["first-ok"]);
    const second = new FakeLlmClient(["second-ok"]);

    await expect(
      new FallbackLlmClient([first, second]).complete(REQUEST),
    ).resolves.toBe("first-ok");
    expect(first.requests).toHaveLength(1);
    expect(second.requests).toHaveLength(0);
  });

  it("moves to the next client after any error", async () => {
    const first = new FakeLlmClient([new Error("provider down")]);
    const second = new FakeLlmClient(["second-ok"]);

    await expect(
      new FallbackLlmClient([first, second]).complete(REQUEST),
    ).resolves.toBe("second-ok");
    expect(first.requests).toHaveLength(1);
    expect(second.requests).toHaveLength(1);
  });

  it("throws LLM_UNAVAILABLE when no client succeeds", async () => {
    const client = new FallbackLlmClient([
      new FakeLlmClient([new Error("down")]),
      new FakeLlmClient([new Error("also down")]),
    ]);

    await expect(client.complete(REQUEST)).rejects.toMatchObject({
      code: "LLM_UNAVAILABLE",
    });
  });

  it("throws LLM_UNAVAILABLE when it has no clients", async () => {
    await expect(
      new FallbackLlmClient([]).complete(REQUEST),
    ).rejects.toMatchObject({ code: "LLM_UNAVAILABLE" });
  });
});
