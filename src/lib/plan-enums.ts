import { z } from "zod";

/**
 * Times of day a daily routine item can belong to.
 */
export const TimeBlockSchema = z.enum([
  "early_morning",
  "morning",
  "midday",
  "afternoon",
  "evening",
  "night",
]);

/**
 * Cost levels an indoor air-quality hack can have.
 */
export const CostSchema = z.enum(["free", "low", "medium", "high"]);

/**
 * Effort levels an indoor air-quality hack can require.
 */
export const EffortSchema = z.enum(["easy", "moderate", "involved"]);

/**
 * Areas a sustainable alternative can address.
 */
export const AreaSchema = z.enum([
  "commute",
  "cooking",
  "heating",
  "waste",
  "energy",
]);
