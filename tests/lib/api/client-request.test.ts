import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ClientError } from "@/lib/api/client-errors";
import { jsonPost, requestJson } from "@/lib/api/client-request";
import type { ClientFetch } from "@/lib/api/client-errors";

const PAYLOAD_SCHEMA = z.object({ value: z.number() });

/**
 * Builds a JSON response for a fake fetch.
 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("jsonPost", () => {
  it("serialises a JSON body with the JSON content type", () => {
    const init = jsonPost({ hello: "world" });

    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(init.body).toBe('{"hello":"world"}');
  });
});

describe("requestJson", () => {
  it("returns validated success data and forwards the signal", async () => {
    const fetchImpl = vi
      .fn<ClientFetch>()
      .mockResolvedValue(jsonResponse({ ok: true, data: { value: 7 } }));
    const signal = new AbortController().signal;

    const result = await requestJson(
      "/api/test",
      PAYLOAD_SCHEMA,
      { method: "GET" },
      { fetchImpl, signal },
    );

    expect(result).toEqual({ value: 7 });
    expect(fetchImpl).toHaveBeenCalledWith("/api/test", {
      method: "GET",
      signal,
    });
  });

  it("maps a network rejection to a typed client error", async () => {
    const fetchImpl = vi
      .fn<ClientFetch>()
      .mockRejectedValue(new TypeError("offline"));

    await expect(
      requestJson("/api/test", PAYLOAD_SCHEMA, {}, { fetchImpl }),
    ).rejects.toMatchObject({
      code: "NETWORK",
      safeMessage:
        "Could not reach the app. Check your connection and try again.",
    });
  });

  it("rethrows abort errors unchanged", async () => {
    const fetchImpl = vi
      .fn<ClientFetch>()
      .mockRejectedValue(new DOMException("Aborted", "AbortError"));

    await expect(
      requestJson("/api/test", PAYLOAD_SCHEMA, {}, { fetchImpl }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("rejects a body that is not JSON", async () => {
    const fetchImpl = vi
      .fn<ClientFetch>()
      .mockResolvedValue(new Response("not json", { status: 200 }));

    await expect(
      requestJson("/api/test", PAYLOAD_SCHEMA, {}, { fetchImpl }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("rejects an unknown envelope", async () => {
    const fetchImpl = vi
      .fn<ClientFetch>()
      .mockResolvedValue(jsonResponse({ unexpected: true }));

    await expect(
      requestJson("/api/test", PAYLOAD_SCHEMA, {}, { fetchImpl }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("rejects a success envelope returned with a failing status", async () => {
    const fetchImpl = vi
      .fn<ClientFetch>()
      .mockResolvedValue(jsonResponse({ ok: true, data: { value: 1 } }, 500));

    await expect(
      requestJson("/api/test", PAYLOAD_SCHEMA, {}, { fetchImpl }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("raises the typed failure carried by a failed envelope", async () => {
    const fetchImpl = vi.fn<ClientFetch>().mockResolvedValue(
      jsonResponse(
        {
          ok: false,
          error: { code: "RATE_LIMITED", message: "Wait a minute." },
        },
        429,
      ),
    );

    const failure = requestJson("/api/test", PAYLOAD_SCHEMA, {}, { fetchImpl });

    await expect(failure).rejects.toBeInstanceOf(ClientError);
    await expect(failure).rejects.toMatchObject({
      code: "RATE_LIMITED",
      safeMessage: "Wait a minute.",
    });
  });

  it("rejects success data that does not match the schema", async () => {
    const fetchImpl = vi
      .fn<ClientFetch>()
      .mockResolvedValue(jsonResponse({ ok: true, data: { value: "seven" } }));

    await expect(
      requestJson("/api/test", PAYLOAD_SCHEMA, {}, { fetchImpl }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
});
