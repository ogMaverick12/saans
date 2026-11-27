import type { AirDigest } from "@/lib/air/schemas";
import { ASK_MAX_OUTPUT_TOKENS, PLAN_MAX_OUTPUT_TOKENS } from "@/lib/config";
import { attachImpact, type AttachedImpactItem } from "@/lib/impact/estimate";
import { IMPACT_FACTORS } from "@/lib/impact/impact-factors";
import type { LlmClient } from "@/lib/llm/client";
import { generateStructured } from "@/lib/llm/generate";
import {
  AskSchema,
  PlanSchema,
  type Ask,
  type DailyRoutineItem,
  type IndoorHack,
  type Plan,
  type SustainableAlternative,
} from "@/lib/llm/plan-schema";
import {
  buildAskPrompt,
  buildPlanPrompt,
  type FactorCatalogEntry,
  type Language,
  type ReadingMode,
} from "@/lib/llm/prompts";
import type { Profile } from "@/lib/profile/schema";

/**
 * A plan whose factor IDs have been replaced with catalog factors.
 */
export type PlanWithImpact = Omit<
  Plan,
  "dailyRoutine" | "indoorHacks" | "sustainableAlternatives"
> & {
  dailyRoutine: AttachedImpactItem<DailyRoutineItem>[];
  indoorHacks: AttachedImpactItem<IndoorHack>[];
  sustainableAlternatives: AttachedImpactItem<SustainableAlternative>[];
};

/**
 * A generated plan together with the digest it was based on.
 */
export interface GeneratedPlan {
  plan: PlanWithImpact;
  digest: AirDigest;
}

/**
 * Inputs for generating one household plan.
 */
export interface GeneratePlanDeps {
  client: LlmClient;
  digest: AirDigest;
  profile: Profile;
  language: Language;
  readingMode: ReadingMode;
  factorCatalog?: readonly FactorCatalogEntry[];
}

/**
 * Inputs for answering one follow-up question about a plan.
 */
export interface AnswerQuestionDeps {
  client: LlmClient;
  question: string;
  digest: AirDigest;
  plan: Plan;
  language: Language;
}

/**
 * Replaces the factor IDs in every plan list with catalog factors.
 */
function attachPlanImpact(plan: Plan): PlanWithImpact {
  return {
    ...plan,
    dailyRoutine: attachImpact(plan.dailyRoutine),
    indoorHacks: attachImpact(plan.indoorHacks),
    sustainableAlternatives: attachImpact(plan.sustainableAlternatives),
  };
}

/**
 * Generates a plan and swaps every factor ID for its catalog numbers.
 */
export async function generatePlan({
  client,
  digest,
  profile,
  language,
  readingMode,
  factorCatalog = IMPACT_FACTORS,
}: GeneratePlanDeps): Promise<GeneratedPlan> {
  const prompt = buildPlanPrompt({
    digest,
    profile,
    language,
    readingMode,
    factorCatalog,
  });
  const plan = await generateStructured({
    client,
    schema: PlanSchema,
    prompt,
    maxOutputTokens: PLAN_MAX_OUTPUT_TOKENS,
  });
  return { plan: attachPlanImpact(plan), digest };
}

/**
 * Answers one follow-up question about an existing plan.
 */
export function answerQuestion({
  client,
  question,
  digest,
  plan,
  language,
}: AnswerQuestionDeps): Promise<Ask> {
  const prompt = buildAskPrompt({ question, digest, plan, language });
  return generateStructured({
    client,
    schema: AskSchema,
    prompt,
    maxOutputTokens: ASK_MAX_OUTPUT_TOKENS,
  });
}
