import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { buildDigest, buildProfile } from "../lib/impact/test-data";
import { VALID_PLAN } from "../lib/llm/test-data";

const mocks = vi.hoisted(() => ({
  getAirDigest: vi.fn(),
  getLlmEnv: vi.fn(),
  createLlmClient: vi.fn(),
  generatePlan: vi.fn(),
  check: vi.fn(),
}));

vi.mock("@/lib/air/get-digest", () => ({
  getAirDigest: mocks.getAirDigest,
}));
vi.mock("@/lib/config", () => ({ getLlmEnv: mocks.getLlmEnv }));
vi.mock("@/lib/llm/factory", () => ({
  createLlmClient: mocks.createLlmClient,
}));
vi.mock("@/lib/llm/plan", () => ({ generatePlan: mocks.generatePlan }));
vi.mock("@/lib/api/rate-limit", () => ({
  apiRateLimiter: { check: mocks.check },
}));

import { POST } from "@/app/api/plan/route";

const FAKE_ENV = { geminiApiKey: "test-key" };
const FAKE_CLIENT = { complete: vi.fn() };
const PLACE = {
  name: "Delhi",
  latitude: 28.61,
  longitude: 77.21,
  countryCode: "IN",
};

function buildBody() {
  return {
    place: PLACE,
    profile: buildProfile(),
    language: "en",
    readingMode: "standard",
  };
}
function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/plan", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.12",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/plan", () => {
  beforeEach(() => {
    mocks.getAirDigest.mockReset();
    mocks.getLlmEnv.mockReset();
    mocks.createLlmClient.mockReset();
    mocks.generatePlan.mockReset();
    mocks.check.mockReset();
    mocks.check.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.getLlmEnv.mockReturnValue(FAKE_ENV);
    mocks.createLlmClient.mockReturnValue(FAKE_CLIENT);
  });

  it("returns the generated plan and its digest", async () => {
    const digest = buildDigest();
    const generated = { plan: VALID_PLAN, digest };
    mocks.getAirDigest.mockResolvedValue(digest);
    mocks.generatePlan.mockResolvedValue(generated);

    const response = await POST(buildRequest(buildBody()));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: generated,
    });
    expect(mocks.getAirDigest).toHaveBeenCalledWith({
      ...PLACE,
      country: null,
      admin1: null,
    });
    expect(mocks.createLlmClient).toHaveBeenCalledWith(FAKE_ENV);
    expect(mocks.generatePlan).toHaveBeenCalledWith({
      client: FAKE_CLIENT,
      digest,
      profile: buildProfile(),
      language: "en",
      readingMode: "standard",
    });
  });

  it("rejects a body without a profile", async () => {
    const body = {
      place: PLACE,
      language: "en",
      readingMode: "standard",
    };

    const response = await POST(buildRequest(body));
    const parsed = await response.json();

    expect(response.status).toBe(400);
    expect(parsed.error.code).toBe("VALIDATION_FAILED");
    expect(parsed.error.message).toContain("profile:");
    expect(mocks.getAirDigest).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when the limiter blocks", async () => {
    mocks.check.mockReturnValue({ allowed: false, retryAfterSeconds: 8 });

    const response = await POST(buildRequest(buildBody()));

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("8");
    expect(mocks.getAirDigest).not.toHaveBeenCalled();
  });

  it("maps an AppError to its safe status and message", async () => {
    mocks.getAirDigest.mockResolvedValue(buildDigest());
    mocks.generatePlan.mockRejectedValue(
      new AppError("LLM_UNAVAILABLE", "The language model is unavailable."),
    );

    const response = await POST(buildRequest(buildBody()));
    const parsed = await response.json();

    expect(response.status).toBe(503);
    expect(parsed.error).toEqual({
      code: "LLM_UNAVAILABLE",
      message: "The language model is unavailable.",
    });
  });

  it("hides unknown error details behind a generic 500", async () => {
    mocks.getAirDigest.mockResolvedValue(buildDigest());
    mocks.generatePlan.mockRejectedValue(new Error("internal secret"));

    const response = await POST(buildRequest(buildBody()));
    const parsed = await response.json();

    expect(response.status).toBe(500);
    expect(parsed.error.code).toBe("INTERNAL");
    expect(JSON.stringify(parsed)).not.toContain("internal secret");
  });
});
