import type { AirTrend, AirWindow } from "@/lib/air/digest-schema";
import type { AirQualityResponse } from "@/lib/air/schemas";

const WINDOW_HOURS = 3;
const TREND_WINDOW_HOURS = 6;
const TREND_THRESHOLD_RATIO = 0.15;
const HOUR_PREFIX_LENGTH = 13;
const HOUR_START_INDEX = 11;
const HOUR_END_INDEX = 13;

/**
 * One hourly timestamp paired with its measured PM2.5 value.
 */
export interface HourlyPoint {
  time: string;
  pm25: number | null;
}

/**
 * Which extreme a three-hour window search is looking for.
 */
export type WindowGoal = "cleanest" | "worst";

function isMeasured(value: number | null): value is number {
  return value !== null;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Pairs hourly timestamps with their PM2.5 values, keeping nulls.
 */
export function buildHourlyPoints(
  hourly: AirQualityResponse["hourly"],
): HourlyPoint[] {
  return hourly.time.map((time, index) => ({
    time,
    pm25: hourly.pm2_5[index] ?? null,
  }));
}

function parseHour(time: string): number {
  return Number(time.slice(HOUR_START_INDEX, HOUR_END_INDEX));
}

/**
 * Averages the measured PM2.5 values, falling back when none exist.
 */
export function averagePm25(points: HourlyPoint[], fallback: number): number {
  const values = points.map((point) => point.pm25).filter(isMeasured);
  return values.length === 0 ? fallback : average(values);
}

function isBetterWindow(
  candidate: AirWindow,
  bestWindow: AirWindow | null,
  goal: WindowGoal,
): boolean {
  if (bestWindow === null) {
    return true;
  }
  return goal === "cleanest"
    ? candidate.meanPm25 < bestWindow.meanPm25
    : candidate.meanPm25 > bestWindow.meanPm25;
}

/**
 * Finds the cleanest or worst three consecutive hours, earliest on ties.
 */
export function findWindow(
  points: HourlyPoint[],
  goal: WindowGoal,
  fallbackMean: number,
): AirWindow {
  let bestWindow: AirWindow | null = null;

  for (let index = 0; index <= points.length - WINDOW_HOURS; index += 1) {
    const windowPoints = points.slice(index, index + WINDOW_HOURS);
    const values = windowPoints.map((point) => point.pm25).filter(isMeasured);
    const firstPoint = windowPoints[0];
    if (values.length === 0 || firstPoint === undefined) {
      continue;
    }

    const startHour = parseHour(firstPoint.time);
    const candidate: AirWindow = {
      startHour,
      endHour: startHour + WINDOW_HOURS,
      meanPm25: average(values),
    };
    if (isBetterWindow(candidate, bestWindow, goal)) {
      bestWindow = candidate;
    }
  }

  return (
    bestWindow ?? {
      startHour: 0,
      endHour: WINDOW_HOURS,
      meanPm25: fallbackMean,
    }
  );
}

/**
 * Compares the next six hours with the current hour using a 15 percent band.
 */
export function computeTrend(
  points: HourlyPoint[],
  currentTime: string,
  currentPm25: number,
): AirTrend {
  const currentHour = currentTime.slice(0, HOUR_PREFIX_LENGTH);
  const currentIndex = points.findIndex(
    (point) => point.time.slice(0, HOUR_PREFIX_LENGTH) === currentHour,
  );
  if (currentIndex < 0) {
    return "steady";
  }

  const nowPm25 = points[currentIndex]?.pm25 ?? currentPm25;
  const futureValues = points
    .slice(currentIndex + 1, currentIndex + 1 + TREND_WINDOW_HOURS)
    .map((point) => point.pm25)
    .filter(isMeasured);
  if (futureValues.length === 0) {
    return "steady";
  }

  const futureMean = average(futureValues);
  if (futureMean <= nowPm25 * (1 - TREND_THRESHOLD_RATIO)) {
    return "improving";
  }
  if (futureMean >= nowPm25 * (1 + TREND_THRESHOLD_RATIO)) {
    return "worsening";
  }
  return "steady";
}
