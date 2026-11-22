import type {
  ClientImpactFactor,
  ClientPlanWithImpact,
} from "@/lib/api/client-plan-schemas";

/**
 * Returns each factor attached to a plan once, in first-seen order.
 */
export function collectPlanFactors(
  plan: ClientPlanWithImpact,
): ClientImpactFactor[] {
  const factorsById = new Map<string, ClientImpactFactor>();
  const items = [
    ...plan.dailyRoutine,
    ...plan.indoorHacks,
    ...plan.sustainableAlternatives,
  ];
  for (const item of items) {
    for (const factor of item.factorIds) {
      factorsById.set(factor.id, factor);
    }
  }
  return [...factorsById.values()];
}

/**
 * Returns the plan's factors that avoid trip emissions, once each.
 */
export function collectTripFactors(
  plan: ClientPlanWithImpact,
): ClientImpactFactor[] {
  return collectPlanFactors(plan).filter(
    (factor) => factor.effect.kind === "emission_avoided",
  );
}
