import { describe, expect, it } from "vitest";
import { analyzeAir } from "@/lib/air/analyze";
import {
  airQualityResponseSchema,
  weatherResponseSchema,
  type AirQualityResponse,
  type GeocodeMatch,
  type WeatherResponse,
} from "@/lib/air/schemas";
import airDelhi from "../../fixtures/air-delhi.json";
import weatherDelhi from "../../fixtures/weather-delhi.json";

const HOURS_PER_DAY = 24;
const CURRENT_HOUR_INDEX = 13;
const TREND_HOURS = 6;

const CALM_WIND_CUE = "Calm winds are trapping pollutants";
const HUMID_AIR_CUE = "Humid air is holding fine particles near the ground";
const COLD_MORNING_CUE = "Cold mornings can trap smog close to the ground";

const DELHI_PLACE: GeocodeMatch = {
  name: "Delhi",
  latitude: 28.61,
  longitude: 77.21,
  countryCode: "IN",
  country: "India",
  admin1: "National Capital Territory of Delhi",
};

interface AirInput {
  currentTime?: string;
  currentPm25?: number;
  currentUsAqi?: number;
  timezone?: string;
  hourlyTime?: string[];
  hourlyPm25?: (number | null)[];
}

/**
 * Builds hourly timestamps for one local day.
 */
function hourlyTimes(date: string, count: number): string[] {
  return Array.from(
    { length: count },
    (_value, hour) => `${date}T${String(hour).padStart(2, "0")}:00`,
  );
}

/**
 * Builds a synthetic air response with sensible defaults.
 */
function buildAir({
  currentTime = "2026-11-19T13:30",
  currentPm25 = 40,
  currentUsAqi = 100,
  timezone = "Asia/Kolkata",
  hourlyTime = hourlyTimes("2026-11-19", HOURS_PER_DAY),
  hourlyPm25 = hourlyTime.map(() => currentPm25),
}: AirInput = {}): AirQualityResponse {
  return {
    timezone,
    current: {
      time: currentTime,
      us_aqi: currentUsAqi,
      pm2_5: currentPm25,
      pm10: null,
    },
    hourly: {
      time: hourlyTime,
      pm2_5: hourlyPm25,
      us_aqi: hourlyTime.map(() => null),
    },
  };
}

/**
 * Builds a synthetic weather response, overriding individual readings.
 */
function buildWeather(
  overrides: Partial<WeatherResponse["current"]> = {},
): WeatherResponse {
  return {
    timezone: "Asia/Kolkata",
    current: {
      time: "2026-11-19T13:30",
      temperature_2m: 23.5,
      relative_humidity_2m: 46,
      wind_speed_10m: 3.8,
      ...overrides,
    },
  };
}

/**
 * Holds the current hour at one value and the next six hours at another.
 */
function buildTrendAir(now: number, future: number): AirQualityResponse {
  const hourlyPm25 = Array.from({ length: HOURS_PER_DAY }, () => now);
  for (let offset = 1; offset <= TREND_HOURS; offset += 1) {
    hourlyPm25[CURRENT_HOUR_INDEX + offset] = future;
  }
  return buildAir({ currentPm25: now, hourlyPm25 });
}

describe("analyzeAir with the real Delhi fixture", () => {
  const digest = analyzeAir(
    airQualityResponseSchema.parse(airDelhi),
    weatherResponseSchema.parse(weatherDelhi),
    DELHI_PLACE,
  );

  it("reports the current readings and categories", () => {
    expect(digest.observedAt).toBe("2026-11-19T13:30");
    expect(digest.pm2_5).toBe(56.6);
    expect(digest.usAqi).toBe(165);
    expect(digest.usCategory).toEqual({
      label: "Unhealthy",
      level: 3,
    });
    expect(digest.cpcbCategory).toEqual({
      label: "Satisfactory",
      level: 1,
    });
  });

  it("computes the daily mean from today's measured hours", () => {
    expect(digest.dailyMeanPm25).toBeCloseTo(91.47, 2);
  });

  it("classifies the next six hours as worsening", () => {
    expect(digest.trend).toBe("worsening");
  });

  it("finds the cleanest and worst three-hour windows", () => {
    expect(digest.cleanestWindow.startHour).toBe(13);
    expect(digest.cleanestWindow.endHour).toBe(16);
    expect(digest.cleanestWindow.meanPm25).toBeCloseTo(51.27, 2);
    expect(digest.worstWindow.startHour).toBe(21);
    expect(digest.worstWindow.endHour).toBe(24);
    expect(digest.worstWindow.meanPm25).toBeCloseTo(152.43, 2);
  });

  it("passes through the weather and the calm-wind cue", () => {
    expect(digest.weather).toEqual({
      tempC: 23.5,
      humidityPct: 46,
      windKmh: 3.8,
    });
    expect(digest.smogCues).toEqual([CALM_WIND_CUE]);
  });
});

describe("analyzeAir CPCB applicability", () => {
  it("includes the CPCB category for India", () => {
    const digest = analyzeAir(
      buildAir({ currentPm25: 56.6 }),
      buildWeather(),
      DELHI_PLACE,
    );

    expect(digest.cpcbCategory).toEqual({
      label: "Satisfactory",
      level: 1,
    });
  });

  it("treats a lowercase country code as India", () => {
    const digest = analyzeAir(buildAir({ currentPm25: 56.6 }), buildWeather(), {
      ...DELHI_PLACE,
      countryCode: "in",
    });

    expect(digest.cpcbCategory?.label).toBe("Satisfactory");
  });

  it("includes the CPCB category for a missing country in the India timezone", () => {
    const digest = analyzeAir(
      buildAir({ currentPm25: 56.6, timezone: "Asia/Kolkata" }),
      buildWeather(),
      { ...DELHI_PLACE, countryCode: null },
    );

    expect(digest.cpcbCategory?.label).toBe("Satisfactory");
  });

  it("omits the CPCB category for other countries", () => {
    const digest = analyzeAir(
      buildAir({ currentPm25: 56.6, timezone: "Asia/Kolkata" }),
      buildWeather(),
      { ...DELHI_PLACE, countryCode: "US" },
    );

    expect(digest.cpcbCategory).toBeNull();
  });

  it("omits the CPCB category for a missing country outside India", () => {
    const digest = analyzeAir(
      buildAir({ currentPm25: 56.6, timezone: "America/New_York" }),
      buildWeather(),
      { ...DELHI_PLACE, countryCode: null },
    );

    expect(digest.cpcbCategory).toBeNull();
  });
});

describe("analyzeAir with sparse hourly data", () => {
  it("skips nulls in the daily mean and in window averages", () => {
    const air = buildAir({
      currentTime: "2026-11-19T02:30",
      currentPm25: 20,
      hourlyTime: hourlyTimes("2026-11-19", 6),
      hourlyPm25: [null, 10, 20, 80, 60, null],
    });

    const digest = analyzeAir(air, buildWeather(), DELHI_PLACE);

    expect(digest.dailyMeanPm25).toBe(42.5);
    expect(digest.cleanestWindow).toEqual({
      startHour: 0,
      endHour: 3,
      meanPm25: 15,
    });
    expect(digest.worstWindow).toEqual({
      startHour: 3,
      endHour: 6,
      meanPm25: 70,
    });
    expect(digest.trend).toBe("worsening");
  });

  it("returns steady when every upcoming hour is null", () => {
    const air = buildAir({
      currentTime: "2026-11-19T03:30",
      currentPm25: 50,
      hourlyTime: hourlyTimes("2026-11-19", 4),
      hourlyPm25: [10, 20, 30, null],
    });

    expect(analyzeAir(air, buildWeather(), DELHI_PLACE).trend).toBe("steady");
  });

  it("compares against the current reading when the current hour is null", () => {
    const hourlyPm25: (number | null)[] = Array.from(
      { length: HOURS_PER_DAY },
      () => 100,
    );
    hourlyPm25[CURRENT_HOUR_INDEX] = null;

    const digest = analyzeAir(
      buildAir({ currentPm25: 50, hourlyPm25 }),
      buildWeather(),
      DELHI_PLACE,
    );

    expect(digest.trend).toBe("worsening");
  });

  it("falls back to the daily mean when there are fewer than three hours", () => {
    const air = buildAir({
      currentTime: "2026-11-19T00:30",
      currentPm25: 40,
      hourlyTime: hourlyTimes("2026-11-19", 2),
      hourlyPm25: [30, 50],
    });

    const digest = analyzeAir(air, buildWeather(), DELHI_PLACE);

    expect(digest.dailyMeanPm25).toBe(40);
    expect(digest.cleanestWindow).toEqual({
      startHour: 0,
      endHour: 3,
      meanPm25: 40,
    });
    expect(digest.worstWindow).toEqual({
      startHour: 0,
      endHour: 3,
      meanPm25: 40,
    });
  });

  it("uses the current reading when there are no hourly values", () => {
    const air = buildAir({
      currentPm25: 55,
      hourlyTime: [],
      hourlyPm25: [],
    });

    const digest = analyzeAir(air, buildWeather(), DELHI_PLACE);

    expect(digest.dailyMeanPm25).toBe(55);
    expect(digest.trend).toBe("steady");
    expect(digest.cleanestWindow.meanPm25).toBe(55);
  });
});

describe("analyzeAir trend thresholds", () => {
  it.each([
    {
      change: "exactly 15 percent lower",
      now: 100,
      future: 85,
      expected: "improving",
    },
    {
      change: "more than 15 percent lower",
      now: 100,
      future: 50,
      expected: "improving",
    },
    { change: "within the band", now: 100, future: 100, expected: "steady" },
    {
      change: "exactly 15 percent higher",
      now: 100,
      future: 115,
      expected: "worsening",
    },
    {
      change: "more than 15 percent higher",
      now: 100,
      future: 150,
      expected: "worsening",
    },
  ])("classifies $change", ({ now, future, expected }) => {
    const digest = analyzeAir(
      buildTrendAir(now, future),
      buildWeather(),
      DELHI_PLACE,
    );

    expect(digest.trend).toBe(expected);
  });

  it("treats just inside the band as steady", () => {
    const improvingEdge = analyzeAir(
      buildTrendAir(100, 86),
      buildWeather(),
      DELHI_PLACE,
    );
    const worseningEdge = analyzeAir(
      buildTrendAir(100, 114),
      buildWeather(),
      DELHI_PLACE,
    );

    expect(improvingEdge.trend).toBe("steady");
    expect(worseningEdge.trend).toBe("steady");
  });
});

describe("analyzeAir window selection", () => {
  it("keeps the earliest window when means tie", () => {
    const air = buildAir({
      currentTime: "2026-11-19T00:30",
      currentPm25: 10,
      hourlyTime: hourlyTimes("2026-11-19", 6),
      hourlyPm25: [10, 20, 10, 20, 10, 20],
    });

    const digest = analyzeAir(air, buildWeather(), DELHI_PLACE);

    expect(digest.cleanestWindow.startHour).toBe(0);
    expect(digest.cleanestWindow.meanPm25).toBeCloseTo(13.33, 2);
    expect(digest.worstWindow.startHour).toBe(1);
    expect(digest.worstWindow.meanPm25).toBeCloseTo(16.67, 2);
  });
});

describe("analyzeAir smog cues", () => {
  it.each([
    {
      condition: "calm winds",
      weather: { wind_speed_10m: 4.9 },
      expected: [CALM_WIND_CUE],
    },
    {
      condition: "humid air",
      weather: { wind_speed_10m: 10, relative_humidity_2m: 71 },
      expected: [HUMID_AIR_CUE],
    },
    {
      condition: "cold air",
      weather: { wind_speed_10m: 10, temperature_2m: 11.9 },
      expected: [COLD_MORNING_CUE],
    },
    {
      condition: "values exactly at the thresholds",
      weather: {
        wind_speed_10m: 5,
        relative_humidity_2m: 70,
        temperature_2m: 12,
      },
      expected: [],
    },
    {
      condition: "all three conditions",
      weather: {
        wind_speed_10m: 1,
        relative_humidity_2m: 90,
        temperature_2m: 5,
      },
      expected: [CALM_WIND_CUE, HUMID_AIR_CUE, COLD_MORNING_CUE],
    },
  ])("adds cues for $condition", ({ weather, expected }) => {
    const digest = analyzeAir(buildAir(), buildWeather(weather), DELHI_PLACE);

    expect(digest.smogCues).toEqual(expected);
  });
});
