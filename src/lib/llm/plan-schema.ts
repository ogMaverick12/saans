import { z } from "zod";

const TITLE_MAX_CHARS = 80;
const TEXT_MAX_CHARS = 280;
const ANSWER_MAX_CHARS = 600;
const MAX_ACTIONS = 3;
const MAX_FOLLOW_UPS = 3;

const titleSchema = z.string().trim().min(1).max(TITLE_MAX_CHARS);
const textSchema = z.string().trim().min(1).max(TEXT_MAX_CHARS);
const factorIdsSchema = z.array(z.string().trim().min(1));

const TimeBlockSchema = z.enum([
  "early_morning",
  "morning",
  "midday",
  "afternoon",
  "evening",
  "night",
]);
const CostSchema = z.enum(["free", "low", "medium", "high"]);
const EffortSchema = z.enum(["easy", "moderate", "involved"]);
const AreaSchema = z.enum(["commute", "cooking", "heating", "waste", "energy"]);

const AirSummarySchema = z.strictObject({
  headline: titleSchema,
  explanation: textSchema,
  sensitiveGroupNote: textSchema.nullable(),
});

const DailyRoutineItemSchema = z.strictObject({
  timeBlock: TimeBlockSchema,
  title: titleSchema,
  actions: z.array(textSchema).min(1).max(MAX_ACTIONS),
  factorIds: factorIdsSchema,
});

const IndoorHackSchema = z.strictObject({
  title: titleSchema,
  howTo: textSchema,
  cost: CostSchema,
  effort: EffortSchema,
  factorIds: factorIdsSchema,
});

const SustainableAlternativeSchema = z.strictObject({
  area: AreaSchema,
  swap: textSchema,
  whyItHelps: textSchema,
  communityBenefit: textSchema,
  factorIds: factorIdsSchema,
});

const CommunityActionSchema = z.strictObject({
  title: titleSchema,
  description: textSchema,
});

/**
 * Strict shape of the plan the language model must return.
 */
export const PlanSchema = z.strictObject({
  airSummary: AirSummarySchema,
  dailyRoutine: z.array(DailyRoutineItemSchema).min(4).max(6),
  indoorHacks: z.array(IndoorHackSchema).min(3).max(6),
  sustainableAlternatives: z.array(SustainableAlternativeSchema).min(3).max(5),
  communityActions: z.array(CommunityActionSchema).min(2).max(4),
  doctorNote: textSchema.nullable(),
});

/**
 * Strict shape of the answer to one follow-up question.
 */
export const AskSchema = z.strictObject({
  answer: z.string().trim().min(1).max(ANSWER_MAX_CHARS),
  followUps: z.array(textSchema).max(MAX_FOLLOW_UPS),
});

/**
 * A validated plan returned by the language model.
 */
export type Plan = z.infer<typeof PlanSchema>;

/**
 * A validated answer to a follow-up question.
 */
export type Ask = z.infer<typeof AskSchema>;

/**
 * One validated item in the daily routine.
 */
export type DailyRoutineItem = Plan["dailyRoutine"][number];

/**
 * One validated indoor air-quality hack.
 */
export type IndoorHack = Plan["indoorHacks"][number];

/**
 * One validated sustainable alternative.
 */
export type SustainableAlternative = Plan["sustainableAlternatives"][number];
