import type {
  ClientImpactFactor,
  ClientPlanWithImpact,
} from "@/lib/api/client-plan-schemas";
import type { Plan } from "@/lib/llm/plan-schema";

/**
 * Replaces attached factor objects with the IDs the ask route expects.
 */
function toFactorIds(factors: readonly ClientImpactFactor[]): string[] {
  return factors.map((factor) => factor.id);
}

/**
 * Converts a plan with attached factors back into the plain plan payload.
 */
export function toAskPlan(plan: ClientPlanWithImpact): Plan {
  return {
    airSummary: plan.airSummary,
    dailyRoutine: plan.dailyRoutine.map(({ factorIds, ...item }) => ({
      ...item,
      factorIds: toFactorIds(factorIds),
    })),
    indoorHacks: plan.indoorHacks.map(({ factorIds, ...item }) => ({
      ...item,
      factorIds: toFactorIds(factorIds),
    })),
    sustainableAlternatives: plan.sustainableAlternatives.map(
      ({ factorIds, ...item }) => ({
        ...item,
        factorIds: toFactorIds(factorIds),
      }),
    ),
    communityActions: plan.communityActions,
    doctorNote: plan.doctorNote,
  };
}
