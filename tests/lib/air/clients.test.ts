import { describe, expect, it, vi } from "vitest";
import { fetchAirQuality, fetchWeather, searchPlaces } from "@/lib/air/clients";
import {
  AIR_CACHE_SECONDS,
  AIR_FORECAST_DAYS,
  COORDINATE_DECIMALS,
  GEOCODING_RESULT_LIMIT,
} from "@/lib/config";
import type { FetchLike } from "@/lib/security/safe-fetch";
import airDelhi from "../../fixtures/air-delhi.json";
import geocodingDelhi from "../../fixtures/geocoding-delhi.json";
import weatherDelhi from "../../fixtures/weather-delhi.json";

/**
 * Creates a fake fetch that responds with a JSON fixture.
 */
function createFixtureFetch(fixture: unknown) {
  return vi.fn<FetchLike>().mockResolvedValue(
    new Response(JSON.stringify(fixture), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}

/**
 * Returns the only request captured by a fake fetch.
 */
function readRequest(
  fetchImpl: ReturnType<typeof createFixtureFetch>,
): [URL, RequestInit?] {
  const request = fetchImpl.mock.calls[0];
  if (request === undefined) {
    throw new Error("Expected the fake fetch to be called once");
  }
  return request;
}

describe("searchPlaces", () => {
  it("maps the real geocoding response to city matches", async () => {
    const fetchImpl = createFixtureFetch(geocodingDelhi);

    const places = await searchPlaces("  Delhi  ", fetchImpl);

    expect(places).toEqual([
      {
        name: "Delhi",
        latitude: 28.65195,
        longitude: 77.23149,
        countryCode: "IN",
        country: "India",
        admin1: "National Capital Territory of Delhi",
      },
      {
        name: "Delhi",
        latitude: 42.27814,
        longitude: -74.91599,
        countryCode: "US",
        country: "United States",
        admin1: "New York",
      },
    ]);
  });

  it("requests the trimmed query and expected options", async () => {
    const fetchImpl = createFixtureFetch(geocodingDelhi);

    await searchPlaces("  Delhi  ", fetchImpl);
    const [url] = readRequest(fetchImpl);

    expect(url.origin).toBe("https://geocoding-api.open-meteo.com");
    expect(url.pathname).toBe("/v1/search");
    expect(url.searchParams.get("name")).toBe("Delhi");
    expect(url.searchParams.get("count")).toBe(String(GEOCODING_RESULT_LIMIT));
    expect(url.searchParams.get("language")).toBe("en");
    expect(url.searchParams.get("format")).toBe("json");
  });

  it("returns an empty list when no city matches", async () => {
    const fetchImpl = createFixtureFetch({ generationtime_ms: 0.1 });

    await expect(searchPlaces("Atlantis", fetchImpl)).resolves.toEqual([]);
  });

  it("maps missing optional fields to null", async () => {
    const fetchImpl = createFixtureFetch({
      results: [{ name: "Nowhere", latitude: 1.5, longitude: 2.5 }],
    });

    await expect(searchPlaces("Nowhere", fetchImpl)).resolves.toEqual([
      {
        name: "Nowhere",
        latitude: 1.5,
        longitude: 2.5,
        countryCode: null,
        country: null,
        admin1: null,
      },
    ]);
  });

  it("maps an invalid body to a safe upstream error", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValue(
        new Response("<html>rate limited</html>", { status: 200 }),
      );

    await expect(searchPlaces("Delhi", fetchImpl)).rejects.toMatchObject({
      code: "UPSTREAM_FAILED",
    });
  });
});

describe("fetchAirQuality", () => {
  it("parses the real response for rounded coordinates", async () => {
    const fetchImpl = createFixtureFetch(airDelhi);

    const air = await fetchAirQuality(28.618, 77.214, fetchImpl);

    expect(air.current.us_aqi).toBe(165);
    expect(air.current.pm2_5).toBe(56.6);
    expect(air.hourly.time).toHaveLength(48);
  });

  it("builds the request with rounded coordinates and a cache hint", async () => {
    const fetchImpl = createFixtureFetch(airDelhi);

    await fetchAirQuality(28.618, 77.214, fetchImpl);
    const [url, init] = readRequest(fetchImpl);

    expect(url.origin).toBe("https://air-quality-api.open-meteo.com");
    expect(url.pathname).toBe("/v1/air-quality");
    expect(url.searchParams.get("latitude")).toBe(
      (28.618).toFixed(COORDINATE_DECIMALS),
    );
    expect(url.searchParams.get("longitude")).toBe(
      (77.214).toFixed(COORDINATE_DECIMALS),
    );
    expect(url.searchParams.get("current")).toBe("us_aqi,pm2_5,pm10");
    expect(url.searchParams.get("hourly")).toBe("pm2_5,us_aqi");
    expect(url.searchParams.get("forecast_days")).toBe(
      String(AIR_FORECAST_DAYS),
    );
    expect(url.searchParams.get("timezone")).toBe("auto");
    expect(init?.next?.revalidate).toBe(AIR_CACHE_SECONDS);
  });

  it("maps a schema mismatch to a safe upstream error", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValue(
        new Response(JSON.stringify({ current: {} }), { status: 200 }),
      );

    await expect(
      fetchAirQuality(28.61, 77.21, fetchImpl),
    ).rejects.toMatchObject({ code: "UPSTREAM_FAILED" });
  });

  it("maps a non-success upstream status to a safe error", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValue(new Response("down", { status: 503 }));

    await expect(
      fetchAirQuality(28.61, 77.21, fetchImpl),
    ).rejects.toMatchObject({ code: "UPSTREAM_FAILED" });
  });
});

describe("fetchWeather", () => {
  it("parses the real response for rounded coordinates", async () => {
    const fetchImpl = createFixtureFetch(weatherDelhi);

    const weather = await fetchWeather(28.576, 77.187, fetchImpl);

    expect(weather.current.temperature_2m).toBe(23.5);
    expect(weather.current.relative_humidity_2m).toBe(46);
    expect(weather.current.wind_speed_10m).toBe(3.8);
  });

  it("builds the request with rounded coordinates and a cache hint", async () => {
    const fetchImpl = createFixtureFetch(weatherDelhi);

    await fetchWeather(28.576, 77.187, fetchImpl);
    const [url, init] = readRequest(fetchImpl);

    expect(url.origin).toBe("https://api.open-meteo.com");
    expect(url.pathname).toBe("/v1/forecast");
    expect(url.searchParams.get("latitude")).toBe(
      (28.576).toFixed(COORDINATE_DECIMALS),
    );
    expect(url.searchParams.get("longitude")).toBe(
      (77.187).toFixed(COORDINATE_DECIMALS),
    );
    expect(url.searchParams.get("current")).toBe(
      "temperature_2m,relative_humidity_2m,wind_speed_10m",
    );
    expect(url.searchParams.get("timezone")).toBe("auto");
    expect(init?.next?.revalidate).toBe(AIR_CACHE_SECONDS);
  });

  it("maps invalid JSON to a safe upstream error", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValue(new Response("not-json", { status: 200 }));

    await expect(fetchWeather(28.61, 77.21, fetchImpl)).rejects.toMatchObject({
      code: "UPSTREAM_FAILED",
    });
  });
});
