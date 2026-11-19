import { describe, expect, it } from "vitest";
import {
  airQualityResponseSchema,
  geocodingResponseSchema,
  weatherResponseSchema,
} from "@/lib/air/schemas";
import airDelhi from "../../fixtures/air-delhi.json";
import geocodingDelhi from "../../fixtures/geocoding-delhi.json";
import weatherDelhi from "../../fixtures/weather-delhi.json";

const MINIMAL_AIR = {
  timezone: "Asia/Kolkata",
  current: {
    time: "2026-11-19T13:30",
    us_aqi: 165,
    pm2_5: 56.6,
    pm10: null,
  },
  hourly: {
    time: ["2026-11-19T13:00"],
    pm2_5: [null],
    us_aqi: [null],
  },
};

describe("air schemas", () => {
  it("parses the real geocoding response", () => {
    const parsed = geocodingResponseSchema.parse(geocodingDelhi);

    expect(parsed.results).toHaveLength(2);
    expect(parsed.results?.[0]).toMatchObject({
      name: "Delhi",
      country_code: "IN",
      country: "India",
      admin1: "National Capital Territory of Delhi",
    });
    expect(parsed.results?.[1]?.country_code).toBe("US");
  });

  it("accepts a geocoding response with no results key", () => {
    const parsed = geocodingResponseSchema.parse({ generationtime_ms: 0.1 });

    expect(parsed.results).toBeUndefined();
  });

  it("parses the real two-day air response", () => {
    const parsed = airQualityResponseSchema.parse(airDelhi);

    expect(parsed.timezone).toBe("Asia/Kolkata");
    expect(parsed.current.us_aqi).toBe(165);
    expect(parsed.current.pm2_5).toBe(56.6);
    expect(parsed.hourly.time).toHaveLength(48);
    expect(parsed.hourly.pm2_5).toHaveLength(48);
    expect(parsed.hourly.us_aqi).toHaveLength(48);
  });

  it("accepts null hourly values", () => {
    const parsed = airQualityResponseSchema.parse(MINIMAL_AIR);

    expect(parsed.hourly.pm2_5).toEqual([null]);
    expect(parsed.hourly.us_aqi).toEqual([null]);
  });

  it("rejects an air response without a timezone", () => {
    const result = airQualityResponseSchema.safeParse({
      current: MINIMAL_AIR.current,
      hourly: MINIMAL_AIR.hourly,
    });

    expect(result.success).toBe(false);
  });

  it("parses the real weather response", () => {
    const parsed = weatherResponseSchema.parse(weatherDelhi);

    expect(parsed.timezone).toBe("Asia/Kolkata");
    expect(parsed.current).toEqual({
      time: "2026-11-19T14:00",
      temperature_2m: 23.5,
      relative_humidity_2m: 46,
      wind_speed_10m: 3.8,
    });
  });

  it("rejects a weather response without current conditions", () => {
    const result = weatherResponseSchema.safeParse({
      timezone: "Asia/Kolkata",
    });

    expect(result.success).toBe(false);
  });
});
