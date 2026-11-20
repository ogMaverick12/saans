import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { buildDigest } from "../lib/impact/test-data";
import { VALID_ASK, VALID_PLAN } from "../lib/llm/test-data";

const mocks = vi.hoisted(() => ({
  getAirDigest: vi.fn(),
  getLlmEnv: vi.fn(),
  createLlmClient: vi.fn(),
  answerQuestion: vi.fn(),
  check: vi.fn(),
}));

vi.mock("@/lib/air/get-digest", () => ({
  getAirDigest: mocks.getAirDigest,
}));
vi.mock("@/lib/config", () => ({ getLlmEnv: mocks.getLlmEnv }));
vi.mock("@/lib/llm/factory", () => ({
  createLlmClient: mocks.createLlmClient,
}));
vi.mock("@/lib/llm/plan", () => ({
  answerQuestion: mocks.answerQuestion,
}));
vi.mock("@/lib/api/rate-limit", () => ({
  apiRateLimiter: { check: mocks.check },
}));

import { POST } from "@/app/api/ask/route";

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
    question: "  Is the purifier enough?  ",
    plan: VALID_PLAN,
    language: "en",
  };
}

function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/ask", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.13",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ask", () => {
  beforeEach(() => {
    mocks.getAirDigest.mockReset();
    mocks.getLlmEnv.mockReset();
    mocks.createLlmClient.mockReset();
    mocks.answerQuestion.mockReset();
    mocks.check.mockReset();
    mocks.check.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.getLlmEnv.mockReturnValue(FAKE_ENV);
    mocks.createLlmClient.mockReturnValue(FAKE_CLIENT);
  });

  it("returns the answer and follow-up suggestions", async () => {
    const digest = buildDigest();
    mocks.getAirDigest.mockResolvedValue(digest);
    mocks.answerQuestion.mockResolvedValue(VALID_ASK);

    const response = await POST(buildRequest(buildBody()));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: VALID_ASK,
    });
    expect(mocks.getAirDigest).toHaveBeenCalledWith({
      ...PLACE,
      country: null,
      admin1: null,
    });
    expect(mocks.answerQuestion).toHaveBeenCalledWith({
      client: FAKE_CLIENT,
      question: "Is the purifier enough?",
      digest,
      plan: VALID_PLAN,
      language: "en",
    });
  });

  it("rejects a question shorter than three characters", async () => {
    const response = await POST(
      buildRequest({ ...buildBody(), question: "hi" }),
    );
    const parsed = await response.json();

    expect(response.status).toBe(400);
    expect(parsed.error.code).toBe("VALIDATION_FAILED");
    expect(parsed.error.message).toContain("question:");
    expect(mocks.getAirDigest).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when the limiter blocks", async () => {
    mocks.check.mockReturnValue({ allowed: false, retryAfterSeconds: 7 });

    const response = await POST(buildRequest(buildBody()));

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("7");
    expect(mocks.getAirDigest).not.toHaveBeenCalled();
  });

  it("maps an AppError to its safe status and message", async () => {
    mocks.getAirDigest.mockResolvedValue(buildDigest());
    mocks.answerQuestion.mockRejectedValue(
      new AppError("LLM_BAD_OUTPUT", "The language model reply was invalid."),
    );

    const response = await POST(buildRequest(buildBody()));
    const parsed = await response.json();

    expect(response.status).toBe(502);
    expect(parsed.error).toEqual({
      code: "LLM_BAD_OUTPUT",
      message: "The language model reply was invalid.",
    });
  });

  it("hides unknown error details behind a generic 500", async () => {
    mocks.getAirDigest.mockResolvedValue(buildDigest());
    mocks.answerQuestion.mockRejectedValue(new Error("internal secret"));

    const response = await POST(buildRequest(buildBody()));
    const parsed = await response.json();

    expect(response.status).toBe(500);
    expect(parsed.error.code).toBe("INTERNAL");
    expect(JSON.stringify(parsed)).not.toContain("internal secret");
  });
});
