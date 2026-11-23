import { describe, expect, it, vi } from "vitest";
import { withApiGuard } from "@/lib/api/guard";
import { PRIVATE_CACHE_CONTROL } from "@/lib/api/responses";
import {
  buildRequest,
  createLimiter,
  TEST_IP,
  TEST_SCHEMA,
} from "./guard-helpers";

describe("withApiGuard", () => {
  it("parses query input and wraps the result with no-store", async () => {
    const limiter = createLimiter();
    const handler = vi.fn(({ q }: { q: string }) => ({ echo: q }));
    const GET = withApiGuard({
      schema: TEST_SCHEMA,
      handler,
      rateLimiter: limiter,
    });

    const response = await GET(buildRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: { echo: "Delhi" },
    });
    expect(limiter.check).toHaveBeenCalledWith(TEST_IP);
    expect(handler).toHaveBeenCalledWith({ q: "Delhi" });
  });

  it("parses a JSON body for non-GET methods", async () => {
    const handler = vi.fn(({ q }: { q: string }) => q);
    const POST = withApiGuard({
      schema: TEST_SCHEMA,
      handler,
      rateLimiter: createLimiter(),
    });

    const response = await POST(
      buildRequest("/api/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q: "Mumbai" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: "Mumbai",
    });
  });

  it("uses the configured cache policy", async () => {
    const GET = withApiGuard({
      schema: TEST_SCHEMA,
      handler: () => "cached",
      rateLimiter: createLimiter(),
      cacheControl: PRIVATE_CACHE_CONTROL,
    });

    const response = await GET(buildRequest());

    expect(response.headers.get("cache-control")).toBe("private, max-age=300");
  });

  it("returns field-level messages when validation fails", async () => {
    const handler = vi.fn();
    const GET = withApiGuard({
      schema: TEST_SCHEMA,
      handler,
      rateLimiter: createLimiter(),
    });

    const response = await GET(buildRequest("/api/test?q=a"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.message).toContain("q:");
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects a malformed JSON body", async () => {
    const POST = withApiGuard({
      schema: TEST_SCHEMA,
      handler: () => "unused",
      rateLimiter: createLimiter(),
    });

    const response = await POST(
      buildRequest("/api/test", { method: "POST", body: "{" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toContain("valid JSON");
  });

  it("returns 429 with the limiter's Retry-After value", async () => {
    const handler = vi.fn();
    const GET = withApiGuard({
      schema: TEST_SCHEMA,
      handler,
      rateLimiter: createLimiter(false, 37),
    });

    const response = await GET(buildRequest());

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("37");
    expect(handler).not.toHaveBeenCalled();
  });
});
