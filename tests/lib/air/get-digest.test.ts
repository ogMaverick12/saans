import { describe, expect, it, vi } from "vitest";
import { getAirDigest } from "@/lib/air/get-digest";
import type { GeocodeMatch } from "@/lib/air/schemas";
import type { FetchLike } from "@/lib/security/safe-fetch";
import airDelhi from "../../fixtures/air-delhi.json";
import weatherDelhi from "../../fixtures/weather-delhi.json";

const AIR_HOST = "air-quality-api.open-meteo.com";

const DELHI_PLACE: GeocodeMatch = {
  name: "Delhi",
  latitude: 28.61,
  longitude: 77.21,
  countryCode: "IN",
  country: "India",
  admin1: "National Capital Territory of Delhi",
};

/**
 * Wraps a fixture in a successful JSON response.
 */
function jsonResponse(fixture: unknown): Response {
  return new Response(JSON.stringify(fixture), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("getAirDigest", () => {
  it("fetches both upstreams and returns an analysed digest", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockImplementation((url) =>
        Promise.resolve(
          jsonResponse(url.hostname === AIR_HOST ? airDelhi : weatherDelhi),
        ),
      );

    const digest = await getAirDigest(DELHI_PLACE, { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const hosts = fetchImpl.mock.calls.map(([url]) => url.hostname).sort();
    expect(hosts).toEqual([AIR_HOST, "api.open-meteo.com"]);
    expect(digest.observedAt).toBe("2026-11-19T13:30");
    expect(digest.usCategory.level).toBe(3);
    expect(digest.cpcbCategory?.label).toBe("Satisfactory");
    expect(digest.trend).toBe("worsening");
  });

  it("propagates an upstream failure", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValue(new Response("down", { status: 503 }));

    await expect(
      getAirDigest(DELHI_PLACE, { fetchImpl }),
    ).rejects.toMatchObject({ code: "UPSTREAM_FAILED" });
  });

  it("propagates a network failure", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockRejectedValue(new TypeError("network down"));

    await expect(
      getAirDigest(DELHI_PLACE, { fetchImpl }),
    ).rejects.toMatchObject({ code: "UPSTREAM_FAILED" });
  });
});
