import { z } from "zod";
import {
  ANSWER_MAX_CHARS,
  MAX_ACTIONS,
  MAX_FOLLOW_UPS,
  PLAN_ITEM_COUNTS,
  TEXT_MAX_CHARS,
  TITLE_MAX_CHARS,
} from "@/lib/config";
import {
  AreaSchema,
  CostSchema,
  EffortSchema,
  TimeBlockSchema,
} from "@/lib/plan-enums";

const titleSchema = z.string().trim().min(1).max(TITLE_MAX_CHARS);
const textSchema = z.string().trim().min(1).max(TEXT_MAX_CHARS);
const factorIdsSchema = z.array(z.string().trim().min(1));

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
  dailyRoutine: z
    .array(DailyRoutineItemSchema)
    .min(PLAN_ITEM_COUNTS.dailyRoutine.min)
    .max(PLAN_ITEM_COUNTS.dailyRoutine.max),
  indoorHacks: z
    .array(IndoorHackSchema)
    .min(PLAN_ITEM_COUNTS.indoorHacks.min)
    .max(PLAN_ITEM_COUNTS.indoorHacks.max),
  sustainableAlternatives: z
    .array(SustainableAlternativeSchema)
    .min(PLAN_ITEM_COUNTS.sustainableAlternatives.min)
    .max(PLAN_ITEM_COUNTS.sustainableAlternatives.max),
  communityActions: z
    .array(CommunityActionSchema)
    .min(PLAN_ITEM_COUNTS.communityActions.min)
    .max(PLAN_ITEM_COUNTS.communityActions.max),
  doctorNote: textSchema.nullable(),
});

/**
 * Strict shape of the answer to one follow-up question.
 */
export const AskSchema = z.strictObject({
  answer: z.string().trim().min(1).max(ANSWER_MAX_CHARS),
  followUps: z.array(textSchema).max(MAX_FOLLOW_UPS),
});

export type Plan = z.infer<typeof PlanSchema>;

export type Ask = z.infer<typeof AskSchema>;

export type DailyRoutineItem = Plan["dailyRoutine"][number];

export type IndoorHack = Plan["indoorHacks"][number];

export type SustainableAlternative = Plan["sustainableAlternatives"][number];
