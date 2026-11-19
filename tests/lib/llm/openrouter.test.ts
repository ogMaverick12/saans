import { describe, expect, it, vi } from "vitest";
import { LLM_TEMPERATURE } from "@/lib/llm/client";
import { createOpenRouterClient } from "@/lib/llm/openrouter";
import type { FetchLike } from "@/lib/security/safe-fetch";
import { jsonResponse } from "./test-data";

/**
 * Creates a fake fetch that returns one JSON response.
 */
function createFetch(payload: unknown, status = 200) {
  return vi.fn<FetchLike>().mockResolvedValue(jsonResponse(payload, status));
}

/**
 * Returns the only request captured by a fake fetch.
 */
function readRequest(
  fetchImpl: ReturnType<typeof createFetch>,
): [URL, RequestInit?] {
  const request = fetchImpl.mock.calls[0];
  if (request === undefined) {
    throw new Error("Expected the fake fetch to be called once");
  }
  return request;
}

describe("createOpenRouterClient", () => {
  it("returns the choice content and sends the documented request", async () => {
    const fetchImpl = createFetch({
      choices: [{ message: { content: '{"ok":true}' } }],
    });
    const client = createOpenRouterClient({
      apiKey: "openrouter-key",
      model: "openrouter/model",
      fetchImpl,
    });

    await expect(
      client.complete({
        system: "system rules",
        user: "user prompt",
        maxOutputTokens: 321,
      }),
    ).resolves.toBe('{"ok":true}');

    const [url, init] = readRequest(fetchImpl);
    expect(url.toString()).toBe(
      "https://openrouter.ai/api/v1/chat/completions",
    );
    expect(init?.method).toBe("POST");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    const headers = new Headers(init?.headers);
    expect(headers.get("authorization")).toBe("Bearer openrouter-key");
    expect(headers.get("content-type")).toBe("application/json");
    expect(JSON.parse(String(init?.body))).toEqual({
      model: "openrouter/model",
      messages: [
        { role: "system", content: "system rules" },
        { role: "user", content: "user prompt" },
      ],
      response_format: { type: "json_object" },
      max_tokens: 321,
      temperature: LLM_TEMPERATURE,
    });
  });

  it("maps a server error to a safe upstream error", async () => {
    const fetchImpl = createFetch({ error: "down" }, 503);
    const client = createOpenRouterClient({
      apiKey: "openrouter-key",
      model: "openrouter/model",
      fetchImpl,
    });

    await expect(
      client.complete({ system: "s", user: "u", maxOutputTokens: 10 }),
    ).rejects.toMatchObject({ code: "UPSTREAM_FAILED" });
  });

  it("rejects a response without choice content", async () => {
    const fetchImpl = createFetch({ choices: [] });
    const client = createOpenRouterClient({
      apiKey: "openrouter-key",
      model: "openrouter/model",
      fetchImpl,
    });

    await expect(
      client.complete({ system: "s", user: "u", maxOutputTokens: 10 }),
    ).rejects.toMatchObject({ code: "UPSTREAM_FAILED" });
  });

  it("rejects a body that is not JSON", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValue(new Response("not-json", { status: 200 }));
    const client = createOpenRouterClient({
      apiKey: "openrouter-key",
      model: "openrouter/model",
      fetchImpl,
    });

    await expect(
      client.complete({ system: "s", user: "u", maxOutputTokens: 10 }),
    ).rejects.toMatchObject({ code: "UPSTREAM_FAILED" });
  });
});
