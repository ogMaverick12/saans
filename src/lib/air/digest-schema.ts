import { z } from "zod";

const AQI_MIN_LEVEL = 0;
const AQI_MAX_LEVEL = 5;
const MIN_HUMIDITY = 0;
const MAX_HUMIDITY = 100;

/**
 * One of the six AQI severity levels shared by the US AQI and CPCB scales.
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
 * Compact, prompt-ready summary of today's air for one place.
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

export type AqiLevel = z.infer<typeof AqiLevelSchema>;

/**
 * A category label paired with its severity level.
 */
export type AqiCategory = z.infer<typeof AqiCategorySchema>;

/**
 * Direction of the six-hour PM2.5 trend.
 */
export type AirTrend = AirDigest["trend"];

/**
 * A three-hour local window with its mean PM2.5.
 */
export type AirWindow = z.infer<typeof AirWindowSchema>;

/**
 * Current weather values used by the digest.
 */
export type WeatherSnapshot = z.infer<typeof WeatherSnapshotSchema>;

/**
 * Compact, prompt-ready summary of today's air for one place.
 */
export type AirDigest = z.infer<typeof AirDigestSchema>;
