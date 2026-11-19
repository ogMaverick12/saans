import type { ZodType } from "zod";
import {
  AIR_CACHE_SECONDS,
  AIR_FORECAST_DAYS,
  AIR_QUALITY_BASE_URL,
  COORDINATE_DECIMALS,
  GEOCODING_BASE_URL,
  GEOCODING_RESULT_LIMIT,
  WEATHER_BASE_URL,
} from "@/lib/config";
import { AppError } from "@/lib/errors";
import { safeFetch, type FetchLike } from "@/lib/security/safe-fetch";
import {
  airQualityResponseSchema,
  geocodingResponseSchema,
  weatherResponseSchema,
  type AirQualityResponse,
  type GeocodeMatch,
  type GeocodingResponse,
  type GeocodingResult,
  type WeatherResponse,
} from "@/lib/air/schemas";

const BAD_RESPONSE_MESSAGE =
  "The air data service returned an unexpected response.";
const AIR_CURRENT_FIELDS = "us_aqi,pm2_5,pm10";
const AIR_HOURLY_FIELDS = "pm2_5,us_aqi";
const WEATHER_CURRENT_FIELDS =
  "temperature_2m,relative_humidity_2m,wind_speed_10m";
const SEARCH_LANGUAGE = "en";
const JSON_FORMAT = "json";
const AUTO_TIMEZONE = "auto";

function roundCoordinate(value: number): number {
  return Number(value.toFixed(COORDINATE_DECIMALS));
}

async function parseUpstreamJson<T>(
  response: Response,
  schema: ZodType<T>,
): Promise<T> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AppError("UPSTREAM_FAILED", BAD_RESPONSE_MESSAGE);
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new AppError("UPSTREAM_FAILED", BAD_RESPONSE_MESSAGE);
  }
  return parsed.data;
}

function toGeocodeMatch(result: GeocodingResult): GeocodeMatch {
  return {
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    countryCode: result.country_code ?? null,
    country: result.country ?? null,
    admin1: result.admin1 ?? null,
  };
}

function buildAirQualityUrl(lat: number, lon: number): URL {
  const url = new URL(AIR_QUALITY_BASE_URL);
  url.searchParams.set("latitude", String(roundCoordinate(lat)));
  url.searchParams.set("longitude", String(roundCoordinate(lon)));
  url.searchParams.set("current", AIR_CURRENT_FIELDS);
  url.searchParams.set("hourly", AIR_HOURLY_FIELDS);
  url.searchParams.set("forecast_days", String(AIR_FORECAST_DAYS));
  url.searchParams.set("timezone", AUTO_TIMEZONE);
  return url;
}

function buildWeatherUrl(lat: number, lon: number): URL {
  const url = new URL(WEATHER_BASE_URL);
  url.searchParams.set("latitude", String(roundCoordinate(lat)));
  url.searchParams.set("longitude", String(roundCoordinate(lon)));
  url.searchParams.set("current", WEATHER_CURRENT_FIELDS);
  url.searchParams.set("timezone", AUTO_TIMEZONE);
  return url;
}

/**
 * Searches Open-Meteo geocoding for up to five matching cities.
 */
export async function searchPlaces(
  query: string,
  fetchImpl: FetchLike = fetch,
): Promise<GeocodeMatch[]> {
  const url = new URL(GEOCODING_BASE_URL);
  url.searchParams.set("name", query.trim());
  url.searchParams.set("count", String(GEOCODING_RESULT_LIMIT));
  url.searchParams.set("language", SEARCH_LANGUAGE);
  url.searchParams.set("format", JSON_FORMAT);

  const response = await safeFetch(url, {}, { fetchImpl });
  const payload: GeocodingResponse = await parseUpstreamJson(
    response,
    geocodingResponseSchema,
  );
  return (payload.results ?? []).map(toGeocodeMatch);
}

/**
 * Fetches current and hourly air quality for rounded coordinates.
 */
export async function fetchAirQuality(
  lat: number,
  lon: number,
  fetchImpl: FetchLike = fetch,
): Promise<AirQualityResponse> {
  const response = await safeFetch(
    buildAirQualityUrl(lat, lon),
    { next: { revalidate: AIR_CACHE_SECONDS } },
    { fetchImpl },
  );
  return parseUpstreamJson(response, airQualityResponseSchema);
}

/**
 * Fetches current weather for rounded coordinates.
 */
export async function fetchWeather(
  lat: number,
  lon: number,
  fetchImpl: FetchLike = fetch,
): Promise<WeatherResponse> {
  const response = await safeFetch(
    buildWeatherUrl(lat, lon),
    { next: { revalidate: AIR_CACHE_SECONDS } },
    { fetchImpl },
  );
  return parseUpstreamJson(response, weatherResponseSchema);
}
