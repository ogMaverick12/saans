import { cpcbPm25Category, usAqiCategory } from "@/lib/air/aqi-scales";
import {
  averagePm25,
  buildHourlyPoints,
  computeTrend,
  findWindow,
} from "@/lib/air/hourly";
import type {
  AirDigest,
  AirQualityResponse,
  GeocodeMatch,
  WeatherResponse,
} from "@/lib/air/schemas";

const CALM_WIND_KMH = 5;
const HUMID_AIR_PERCENT = 70;
const COLD_TEMPERATURE_C = 12;
const DATE_LENGTH = 10;
const CPCB_TIMEZONE = "Asia/Kolkata";

const CALM_WIND_CUE = "Calm winds are trapping pollutants";
const HUMID_AIR_CUE = "Humid air is holding fine particles near the ground";
const COLD_MORNING_CUE = "Cold mornings can trap smog close to the ground";

/**
 * Builds the smog cues implied by current wind, humidity and temperature.
 */
function buildSmogCues(current: WeatherResponse["current"]): string[] {
  const cues: string[] = [];
  if (current.wind_speed_10m < CALM_WIND_KMH) {
    cues.push(CALM_WIND_CUE);
  }
  if (current.relative_humidity_2m > HUMID_AIR_PERCENT) {
    cues.push(HUMID_AIR_CUE);
  }
  if (current.temperature_2m < COLD_TEMPERATURE_C) {
    cues.push(COLD_MORNING_CUE);
  }
  return cues;
}

/**
 * Turns raw air and weather responses into a compact, prompt-ready digest.
 */
export function analyzeAir(
  air: AirQualityResponse,
  weather: WeatherResponse,
  place: GeocodeMatch,
): AirDigest {
  const points = buildHourlyPoints(air.hourly);
  const today = air.current.time.slice(0, DATE_LENGTH);
  const todayPoints = points.filter((point) => point.time.startsWith(today));
  const dailyMeanPm25 = averagePm25(todayPoints, air.current.pm2_5);
  const countryCode = place.countryCode?.toUpperCase() ?? null;
  const useCpcb =
    countryCode === "IN" ||
    (countryCode === null && air.timezone === CPCB_TIMEZONE);

  return {
    observedAt: air.current.time,
    pm2_5: air.current.pm2_5,
    usAqi: air.current.us_aqi,
    usCategory: usAqiCategory(air.current.us_aqi),
    cpcbCategory: useCpcb ? cpcbPm25Category(air.current.pm2_5) : null,
    dailyMeanPm25,
    trend: computeTrend(points, air.current.time, air.current.pm2_5),
    cleanestWindow: findWindow(todayPoints, "cleanest", dailyMeanPm25),
    worstWindow: findWindow(todayPoints, "worst", dailyMeanPm25),
    weather: {
      tempC: weather.current.temperature_2m,
      humidityPct: weather.current.relative_humidity_2m,
      windKmh: weather.current.wind_speed_10m,
    },
    smogCues: buildSmogCues(weather.current),
  };
}
