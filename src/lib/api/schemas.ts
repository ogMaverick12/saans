import { z } from "zod";
import { PlanSchema } from "@/lib/llm/plan-schema";
import { ProfileSchema } from "@/lib/profile/schema";

const MIN_QUERY_CHARS = 2;
const MAX_QUERY_CHARS = 80;
const MIN_QUESTION_CHARS = 3;
const MAX_QUESTION_CHARS = 300;
const MAX_PLACE_NAME_CHARS = 80;
const MAX_COUNTRY_CHARS = 80;
const MAX_COUNTRY_CODE_CHARS = 8;

/**
 * Parses a query-string coordinate and rejects blank values.
 */
function coordinate(min: number, max: number) {
  return z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.coerce.number().min(min).max(max),
  );
}

/**
 * Query parameters for city search.
 */
export const GeocodeQuerySchema = z.object({
  q: z.string().trim().min(MIN_QUERY_CHARS).max(MAX_QUERY_CHARS),
});

/**
 * Query parameters for the air digest endpoint.
 */
export const AirQuerySchema = z.object({
  lat: coordinate(-90, 90),
  lon: coordinate(-180, 180),
  name: z
    .string()
    .trim()
    .min(1)
    .max(MAX_PLACE_NAME_CHARS)
    .default("Selected location"),
  country: z.string().trim().max(MAX_COUNTRY_CHARS).optional(),
});

/**
 * A place selected in the browser.
 */
export const PlaceSchema = z.object({
  name: z.string().trim().min(1).max(MAX_PLACE_NAME_CHARS),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  countryCode: z.string().trim().max(MAX_COUNTRY_CODE_CHARS).nullable(),
});

/**
 * Language shared by plan and ask requests.
 */
export const LanguageSchema = z.enum(["en", "hi", "bn"]);

/**
 * Reading mode shared by plan requests.
 */
export const ReadingModeSchema = z.enum(["standard", "simple"]);

/**
 * Body for generating a household plan.
 */
export const PlanRequestSchema = z.object({
  place: PlaceSchema,
  profile: ProfileSchema,
  language: LanguageSchema,
  readingMode: ReadingModeSchema,
});

/**
 * Body for asking a follow-up question about a plan.
 */
export const AskRequestSchema = z.object({
  place: PlaceSchema,
  question: z
    .string()
    .trim()
    .min(MIN_QUESTION_CHARS)
    .max(MAX_QUESTION_CHARS),
  plan: PlanSchema,
  language: LanguageSchema,
});

/**
 * Query parameters for the health endpoint.
 */
export const HealthQuerySchema = z.object({
  probe: z.literal("1").optional(),
});

/**
 * Validated city-search query.
 */
export type GeocodeQuery = z.infer<typeof GeocodeQuerySchema>;

/**
 * Validated air-digest query.
 */
export type AirQuery = z.infer<typeof AirQuerySchema>;

/**
 * Validated place input.
 */
export type PlaceInput = z.infer<typeof PlaceSchema>;

/**
 * Validated plan request.
 */
export type PlanRequest = z.infer<typeof PlanRequestSchema>;

/**
 * Validated ask request.
 */
export type AskRequest = z.infer<typeof AskRequestSchema>;

/**
 * Validated health query.
 */
export type HealthQuery = z.infer<typeof HealthQuerySchema>;
