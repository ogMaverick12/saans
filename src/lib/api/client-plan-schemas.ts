import { z } from "zod";
import { AirDigestSchema } from "@/lib/api/client-schemas";
import { FACTOR_IDS } from "@/lib/impact/impact-types";
import {
  AreaSchema,
  CostSchema,
  EffortSchema,
  TimeBlockSchema,
} from "@/lib/plan-enums";

const PERCENT_MIN = 0;
const PERCENT_MAX = 100;

const ExposureReductionSchema = z.object({
  kind: z.literal("exposure_reduction"),
  lowPct: z.number().min(PERCENT_MIN).max(PERCENT_MAX),
  typicalPct: z.number().min(PERCENT_MIN).max(PERCENT_MAX),
  highPct: z.number().min(PERCENT_MIN).max(PERCENT_MAX),
});

const EmissionAvoidedSchema = z.object({
  kind: z.literal("emission_avoided"),
  kgCo2ePerTrip: z.number().nonnegative(),
});

const ComputedSchema = z.object({ kind: z.literal("computed") });

const QualitativeSchema = z.object({
  kind: z.literal("qualitative"),
  note: z.string().min(1),
});

/**
 * The numeric or descriptive effect attached to an impact factor.
 */
const ImpactEffectSchema = z.discriminatedUnion("kind", [
  ExposureReductionSchema,
  EmissionAvoidedSchema,
  ComputedSchema,
  QualitativeSchema,
]);

/**
 * One catalog factor attached to a plan item by the API.
 */
export const ImpactFactorSchema = z.object({
  id: z.enum(FACTOR_IDS),
  label: z.string().min(1),
  group: z.enum([
    "mask",
    "cleaner",
    "ventilation",
    "cooking",
    "timing",
    "commute",
    "waste",
    "housekeeping",
  ]),
  appliesTo: z.enum(["outdoor", "indoor", "trip"]),
  effect: ImpactEffectSchema,
  source: z.string().min(1),
  confidence: z.enum(["approximate", "qualitative"]),
});

const AirSummarySchema = z.object({
  headline: z.string().min(1),
  explanation: z.string().min(1),
  sensitiveGroupNote: z.string().nullable(),
});

const DailyRoutineItemSchema = z.object({
  timeBlock: TimeBlockSchema,
  title: z.string().min(1),
  actions: z.array(z.string().min(1)).min(1),
  factorIds: z.array(ImpactFactorSchema),
});

const IndoorHackSchema = z.object({
  title: z.string().min(1),
  howTo: z.string().min(1),
  cost: CostSchema,
  effort: EffortSchema,
  factorIds: z.array(ImpactFactorSchema),
});

const SustainableAlternativeSchema = z.object({
  area: AreaSchema,
  swap: z.string().min(1),
  whyItHelps: z.string().min(1),
  communityBenefit: z.string().min(1),
  factorIds: z.array(ImpactFactorSchema),
});

const CommunityActionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

/**
 * A plan whose factor IDs have been replaced with catalog factors.
 */
const PlanWithImpactSchema = z.object({
  airSummary: AirSummarySchema,
  dailyRoutine: z.array(DailyRoutineItemSchema),
  indoorHacks: z.array(IndoorHackSchema),
  sustainableAlternatives: z.array(SustainableAlternativeSchema),
  communityActions: z.array(CommunityActionSchema),
  doctorNote: z.string().nullable(),
});

/**
 * The plan route response with the digest it was based on.
 */
export const PlanResponseSchema = z.object({
  plan: PlanWithImpactSchema,
  digest: AirDigestSchema,
});

/**
 * One impact factor parsed from the browser API.
 */
export type ClientImpactFactor = z.infer<typeof ImpactFactorSchema>;

/**
 * A plan with attached impact factors parsed from the browser API.
 */
export type ClientPlanWithImpact = z.infer<typeof PlanWithImpactSchema>;

/**
 * The plan route response parsed in the browser.
 */
export type ClientPlanResponse = z.infer<typeof PlanResponseSchema>;
