import { describe, expect, it, vi } from "vitest";
import { safeFetch, type FetchLike } from "@/lib/security/safe-fetch";

const ALLOWED_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

describe("safeFetch", () => {
  it("returns a successful response and passes an abort signal", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValue(new Response("{}", { status: 200 }));

    const response = await safeFetch(
      new URL(ALLOWED_URL),
      { method: "GET" },
      { fetchImpl, timeoutMs: 1_000 },
    );

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchImpl.mock.calls[0] ?? [];
    expect(requestUrl?.toString()).toBe(ALLOWED_URL);
    expect(requestInit?.signal).toBeInstanceOf(AbortSignal);
  });

  it("blocks HTTP and unknown hosts before calling fetch", async () => {
    const fetchImpl = vi.fn<FetchLike>();

    await expect(
      safeFetch("http://air-quality-api.open-meteo.com/v1/air", undefined, {
        fetchImpl,
      }),
    ).rejects.toMatchObject({ code: "UPSTREAM_BLOCKED" });

    await expect(
      safeFetch("https://evil.example.com/steal", undefined, { fetchImpl }),
    ).rejects.toMatchObject({ code: "UPSTREAM_BLOCKED" });

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("blocks a URL string that cannot be parsed", async () => {
    const fetchImpl = vi.fn<FetchLike>();

    await expect(
      safeFetch("not-a-valid-url", undefined, { fetchImpl }),
    ).rejects.toMatchObject({ code: "UPSTREAM_BLOCKED" });

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("maps a non-success status to a safe upstream error", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValue(new Response("down", { status: 503 }));

    await expect(
      safeFetch(ALLOWED_URL, undefined, { fetchImpl, timeoutMs: 1_000 }),
    ).rejects.toMatchObject({ code: "UPSTREAM_FAILED" });
  });

  it("maps a network rejection to a safe upstream error", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockRejectedValue(new TypeError("network down"));

    await expect(
      safeFetch(ALLOWED_URL, undefined, { fetchImpl, timeoutMs: 1_000 }),
    ).rejects.toMatchObject({ code: "UPSTREAM_FAILED" });
  });

  it("maps a fetch abort to a timeout error", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    const fetchImpl = vi.fn<FetchLike>().mockRejectedValue(abortError);

    await expect(
      safeFetch(ALLOWED_URL, undefined, { fetchImpl, timeoutMs: 1_000 }),
    ).rejects.toMatchObject({ code: "UPSTREAM_TIMEOUT" });
  });

  it("times out a fake fetch that never resolves", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockReturnValue(new Promise<Response>(() => {}));

    await expect(
      safeFetch(ALLOWED_URL, undefined, { fetchImpl, timeoutMs: 10 }),
    ).rejects.toMatchObject({ code: "UPSTREAM_TIMEOUT" });
  });
});
