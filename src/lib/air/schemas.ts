import { z } from "zod";
import type { AqiCategory } from "@/lib/air/aqi-scales";

/**
 * One raw result from the Open-Meteo geocoding API.
 */
const geocodingResultSchema = z.object({
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country_code: z.string().nullish(),
  country: z.string().nullish(),
  admin1: z.string().nullish(),
});

/**
 * Raw geocoding response; the results key is absent when nothing matches.
 */
export const geocodingResponseSchema = z.object({
  results: z.array(geocodingResultSchema).optional(),
});

/**
 * Raw air quality response from Open-Meteo, including two days of hourly values.
 */
export const airQualityResponseSchema = z.object({
  timezone: z.string(),
  current: z.object({
    time: z.string(),
    us_aqi: z.number(),
    pm2_5: z.number(),
    pm10: z.number().nullable(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    pm2_5: z.array(z.number().nullable()),
    us_aqi: z.array(z.number().nullable()),
  }),
});

/**
 * Raw weather response from Open-Meteo with current conditions.
 */
export const weatherResponseSchema = z.object({
  timezone: z.string(),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    wind_speed_10m: z.number(),
  }),
});

/**
 * Parsed geocoding response.
 */
export type GeocodingResponse = z.infer<typeof geocodingResponseSchema>;

/**
 * One parsed geocoding result.
 */
export type GeocodingResult = z.infer<typeof geocodingResultSchema>;

/**
 * Parsed air quality response.
 */
export type AirQualityResponse = z.infer<typeof airQualityResponseSchema>;

/**
 * Parsed weather response.
 */
export type WeatherResponse = z.infer<typeof weatherResponseSchema>;

/**
 * A city match reduced to the fields the app uses.
 */
export interface GeocodeMatch {
  name: string;
  latitude: number;
  longitude: number;
  countryCode: string | null;
  country: string | null;
  admin1: string | null;
}

/**
 * Direction of the six-hour PM2.5 trend.
 */
export type AirTrend = "improving" | "steady" | "worsening";

/**
 * A three-hour local window with its mean PM2.5.
 */
export interface AirWindow {
  startHour: number;
  endHour: number;
  meanPm25: number;
}

/**
 * Current weather values used by the digest.
 */
export interface WeatherSnapshot {
  tempC: number;
  humidityPct: number;
  windKmh: number;
}

/**
 * Compact, prompt-ready summary of today's air for one place.
 */
export interface AirDigest {
  observedAt: string;
  pm2_5: number;
  usAqi: number;
  usCategory: AqiCategory;
  cpcbCategory: AqiCategory | null;
  dailyMeanPm25: number;
  trend: AirTrend;
  cleanestWindow: AirWindow;
  worstWindow: AirWindow;
  weather: WeatherSnapshot;
  smogCues: string[];
}
