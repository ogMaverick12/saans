import { describe, expect, it, vi, type Mock } from "vitest";
import {
  ClientError,
  askQuestion,
  fetchAirDigest,
  isAbortError,
  requestPlan,
  searchPlaces,
  toClientMessage,
  type ClientFetch,
} from "@/lib/client/client";
import type { AskRequest, PlanRequest, PlaceInput } from "@/lib/api/schemas";
import { buildDigest, buildProfile } from "../impact/test-data";
import { VALID_PLAN } from "../llm/test-data";
import { buildClientPlan } from "./client-test-data";

const DELHI = {
  name: "Delhi",
  latitude: 28.61,
  longitude: 77.21,
  countryCode: "IN",
  country: "India",
  admin1: "Delhi",
};

const PLACE: PlaceInput = {
  name: "Delhi",
  latitude: 28.61,
  longitude: 77.21,
  countryCode: "IN",
};

/**
 * Builds a JSON response for a fake fetch.
 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Returns the first request captured by a fake fetch.
 */
function readCall(
  fetchImpl: Mock<ClientFetch>,
): [string, RequestInit | undefined] {
  const call = fetchImpl.mock.calls[0];
  if (call === undefined) {
    throw new Error("Expected the fake fetch to be called once");
  }
  return [call[0], call[1]];
}

describe("searchPlaces", () => {
  it("requests the trimmed query and parses matches", async () => {
    const fetchImpl = vi
      .fn<ClientFetch>()
      .mockResolvedValue(jsonResponse({ ok: true, data: [DELHI] }));

    const places = await searchPlaces("  Delhi  ", { fetchImpl });
    const [input, init] = readCall(fetchImpl);
    const url = new URL(input, "http://localhost");

    expect(places).toEqual([DELHI]);
    expect(url.pathname).toBe("/api/geocode");
    expect(url.searchParams.get("q")).toBe("Delhi");
    expect(init?.method).toBe("GET");
  });

  it("raises a typed error from a failed envelope", async () => {
    const fetchImpl = vi.fn<ClientFetch>().mockResolvedValue(
      jsonResponse(
        {
          ok: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please wait a moment.",
          },
        },
        429,
      ),
    );

    await expect(searchPlaces("Delhi", { fetchImpl })).rejects.toMatchObject({
      code: "RATE_LIMITED",
      safeMessage: "Too many requests. Please wait a moment.",
    });
  });

  it("rejects malformed data with an invalid-response error", async () => {
    const fetchImpl = vi
      .fn<ClientFetch>()
      .mockResolvedValue(jsonResponse({ ok: true, data: [{ name: "Delhi" }] }));

    await expect(searchPlaces("Delhi", { fetchImpl })).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });

  it("maps a network failure to a safe message", async () => {
    const fetchImpl = vi
      .fn<ClientFetch>()
      .mockRejectedValue(new TypeError("offline"));

    await expect(searchPlaces("Delhi", { fetchImpl })).rejects.toMatchObject({
      code: "NETWORK",
    });
  });

  it("rethrows abort errors unchanged", async () => {
    const fetchImpl = vi
      .fn<ClientFetch>()
      .mockRejectedValue(new DOMException("Aborted", "AbortError"));

    await expect(searchPlaces("Delhi", { fetchImpl })).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});

describe("fetchAirDigest", () => {
  it("sends the rounded coordinates and parses the digest", async () => {
    const digest = buildDigest();
    const fetchImpl = vi
      .fn<ClientFetch>()
      .mockResolvedValue(jsonResponse({ ok: true, data: digest }));

    const result = await fetchAirDigest(PLACE, { fetchImpl });
    const [input] = readCall(fetchImpl);
    const url = new URL(input, "http://localhost");

    expect(result).toEqual(digest);
    expect(url.pathname).toBe("/api/air");
    expect(url.searchParams.get("lat")).toBe("28.61");
    expect(url.searchParams.get("lon")).toBe("77.21");
    expect(url.searchParams.get("name")).toBe("Delhi");
  });
});

describe("requestPlan", () => {
  it("posts the profile and parses the plan response", async () => {
    const plan = buildClientPlan();
    const fetchImpl = vi.fn<ClientFetch>().mockResolvedValue(
      jsonResponse({
        ok: true,
        data: { plan, digest: buildDigest() },
      }),
    );
    const request: PlanRequest = {
      place: PLACE,
      profile: buildProfile(),
      language: "en",
      readingMode: "standard",
    };

    const result = await requestPlan(request, { fetchImpl });
    const [, init] = readCall(fetchImpl);

    expect(result.plan).toEqual(plan);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "Content-Type": "application/json" });
    if (typeof init?.body !== "string") {
      throw new Error("Expected a JSON request body");
    }
    expect(JSON.parse(init.body)).toMatchObject({
      place: PLACE,
      language: "en",
    });
  });
});

describe("askQuestion", () => {
  it("posts a question and parses the answer", async () => {
    const answer = {
      answer: "Keep the windows closed at peak hours.",
      followUps: ["What about the evening?"],
    };
    const fetchImpl = vi
      .fn<ClientFetch>()
      .mockResolvedValue(jsonResponse({ ok: true, data: answer }));
    const request: AskRequest = {
      place: PLACE,
      question: "What should I do this morning?",
      plan: VALID_PLAN,
      language: "en",
    };

    const result = await askQuestion(request, { fetchImpl });

    expect(result).toEqual(answer);
  });
});

describe("client error helpers", () => {
  it("returns a safe message for client and unknown errors", () => {
    expect(toClientMessage(new ClientError("NETWORK", "Offline."))).toBe(
      "Offline.",
    );
    expect(toClientMessage(new Error("secret detail"))).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("recognises abort errors", () => {
    expect(isAbortError(new DOMException("Aborted", "AbortError"))).toBe(true);
    expect(isAbortError(new Error("no"))).toBe(false);
  });
});
