import { z } from "zod";

const AQI_MIN_LEVEL = 0;
const AQI_MAX_LEVEL = 5;
const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;
const MIN_HUMIDITY = 0;
const MAX_HUMIDITY = 100;

/**
 * One of the six AQI severity levels returned by the API.
 */
export const AqiLevelSchema = z.union([
  z.literal(AQI_MIN_LEVEL),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(AQI_MAX_LEVEL),
]);

/**
 * A category label paired with its severity level.
 */
const AqiCategorySchema = z.object({
  label: z.string().min(1),
  level: AqiLevelSchema,
});

/**
 * One place returned by the geocoding route.
 */
export const GeocodeMatchSchema = z.object({
  name: z.string().min(1),
  latitude: z.number().min(MIN_LATITUDE).max(MAX_LATITUDE),
  longitude: z.number().min(MIN_LONGITUDE).max(MAX_LONGITUDE),
  countryCode: z.string().nullable(),
  country: z.string().nullable(),
  admin1: z.string().nullable(),
});

/**
 * A three-hour local window with its mean PM2.5.
 */
const AirWindowSchema = z.object({
  startHour: z.number().int().min(0).max(24),
  endHour: z.number().int().min(0).max(24),
  meanPm25: z.number().nonnegative(),
});

/**
 * Current weather values used by the digest.
 */
const WeatherSnapshotSchema = z.object({
  tempC: z.number(),
  humidityPct: z.number().min(MIN_HUMIDITY).max(MAX_HUMIDITY),
  windKmh: z.number().nonnegative(),
});

/**
 * Compact summary of today's air returned by the air route.
 */
export const AirDigestSchema = z.object({
  observedAt: z.string().min(1),
  pm2_5: z.number().nonnegative(),
  usAqi: z.number().nonnegative(),
  usCategory: AqiCategorySchema,
  cpcbCategory: AqiCategorySchema.nullable(),
  dailyMeanPm25: z.number().nonnegative(),
  trend: z.enum(["improving", "steady", "worsening"]),
  cleanestWindow: AirWindowSchema,
  worstWindow: AirWindowSchema,
  weather: WeatherSnapshotSchema,
  smogCues: z.array(z.string()),
});

/**
 * A geocoding match parsed from the browser API.
 */
export type ClientGeocodeMatch = z.infer<typeof GeocodeMatchSchema>;

/**
 * An air digest parsed from the browser API.
 */
export type ClientAirDigest = z.infer<typeof AirDigestSchema>;
