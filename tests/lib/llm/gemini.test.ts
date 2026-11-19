import { describe, expect, it, vi } from "vitest";
import { createGeminiClient } from "@/lib/llm/gemini";
import { LLM_TEMPERATURE } from "@/lib/llm/client";
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

describe("createGeminiClient", () => {
  it("returns the candidate text and sends the documented request", async () => {
    const fetchImpl = createFetch({
      candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
      usageMetadata: { totalTokenCount: 12 },
    });
    const client = createGeminiClient({
      apiKey: "gemini-key",
      model: "gemini-test",
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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent",
    );
    expect(init?.method).toBe("POST");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    const headers = new Headers(init?.headers);
    expect(headers.get("x-goog-api-key")).toBe("gemini-key");
    expect(headers.get("content-type")).toBe("application/json");
    expect(JSON.parse(String(init?.body))).toEqual({
      systemInstruction: { parts: [{ text: "system rules" }] },
      contents: [{ role: "user", parts: [{ text: "user prompt" }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 321,
        temperature: LLM_TEMPERATURE,
      },
    });
  });

  it("maps a rate-limited response to a safe upstream error", async () => {
    const fetchImpl = createFetch({ error: "quota" }, 429);
    const client = createGeminiClient({
      apiKey: "gemini-key",
      model: "gemini-test",
      fetchImpl,
    });

    await expect(
      client.complete({
        system: "s",
        user: "u",
        maxOutputTokens: 10,
      }),
    ).rejects.toMatchObject({ code: "UPSTREAM_FAILED" });
  });

  it("rejects a response without candidate text", async () => {
    const fetchImpl = createFetch({ candidates: [] });
    const client = createGeminiClient({
      apiKey: "gemini-key",
      model: "gemini-test",
      fetchImpl,
    });

    await expect(
      client.complete({ system: "s", user: "u", maxOutputTokens: 10 }),
    ).rejects.toMatchObject({ code: "UPSTREAM_FAILED" });
  });

  it("rejects a candidate with no text part", async () => {
    const fetchImpl = createFetch({
      candidates: [{ content: { parts: [] } }],
    });
    const client = createGeminiClient({
      apiKey: "gemini-key",
      model: "gemini-test",
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
    const client = createGeminiClient({
      apiKey: "gemini-key",
      model: "gemini-test",
      fetchImpl,
    });

    await expect(
      client.complete({ system: "s", user: "u", maxOutputTokens: 10 }),
    ).rejects.toMatchObject({ code: "UPSTREAM_FAILED" });
  });
});
