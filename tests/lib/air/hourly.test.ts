import { describe, expect, it } from "vitest";
import {
  averagePm25,
  buildHourlyPoints,
  computeTrend,
  findWindow,
  type HourlyPoint,
} from "@/lib/air/hourly";

const DATE = "2026-11-19";

/**
 * Builds hourly points with one value per hour.
 */
function buildPoints(values: (number | null)[]): HourlyPoint[] {
  return values.map((pm25, hour) => ({
    time: `${DATE}T${String(hour).padStart(2, "0")}:00`,
    pm25,
  }));
}

describe("buildHourlyPoints", () => {
  it("pairs timestamps with values and fills gaps with null", () => {
    const points = buildHourlyPoints({
      time: [`${DATE}T00:00`, `${DATE}T01:00`],
      pm2_5: [42],
      us_aqi: [null],
    });

    expect(points).toEqual([
      { time: `${DATE}T00:00`, pm25: 42 },
      { time: `${DATE}T01:00`, pm25: null },
    ]);
  });
});

describe("averagePm25", () => {
  it("averages only measured values", () => {
    expect(averagePm25(buildPoints([10, null, 20]), 99)).toBe(15);
  });

  it("falls back when no value is measured", () => {
    expect(averagePm25(buildPoints([null, null]), 99)).toBe(99);
    expect(averagePm25([], 99)).toBe(99);
  });
});

describe("findWindow", () => {
  it("finds the cleanest and worst three-hour windows", () => {
    const points = buildPoints([10, 20, 10, 20, 10, 20]);

    const cleanest = findWindow(points, "cleanest", 0);
    const worst = findWindow(points, "worst", 0);

    expect(cleanest.startHour).toBe(0);
    expect(cleanest.endHour).toBe(3);
    expect(cleanest.meanPm25).toBeCloseTo(13.33, 2);
    expect(worst.startHour).toBe(1);
    expect(worst.endHour).toBe(4);
    expect(worst.meanPm25).toBeCloseTo(16.67, 2);
  });

  it("returns the fallback window when every candidate is null", () => {
    const window = findWindow(buildPoints([null, null, null]), "worst", 77);

    expect(window).toEqual({ startHour: 0, endHour: 3, meanPm25: 77 });
  });
});

describe("computeTrend", () => {
  it("detects improving and worsening six-hour means", () => {
    const improving = computeTrend(
      buildPoints([100, 80, 80, 80, 80, 80, 80]),
      `${DATE}T00:30`,
      100,
    );
    const worsening = computeTrend(
      buildPoints([100, 120, 120, 120, 120, 120, 120]),
      `${DATE}T00:30`,
      100,
    );

    expect(improving).toBe("improving");
    expect(worsening).toBe("worsening");
  });

  it("stays steady when the future is within the 15 percent band", () => {
    const trend = computeTrend(
      buildPoints([100, 100, 100, 100, 100, 100, 100]),
      `${DATE}T00:30`,
      100,
    );

    expect(trend).toBe("steady");
  });

  it("stays steady without a current hour or future values", () => {
    expect(computeTrend(buildPoints([100]), `${DATE}T00:30`, 100)).toBe(
      "steady",
    );
    expect(computeTrend(buildPoints([100]), `${DATE}T09:30`, 100)).toBe(
      "steady",
    );
  });

  it("falls back to the current reading when the current hour is null", () => {
    const trend = computeTrend(
      buildPoints([null, 120, 120, 120, 120, 120, 120]),
      `${DATE}T00:30`,
      100,
    );

    expect(trend).toBe("worsening");
  });
});
