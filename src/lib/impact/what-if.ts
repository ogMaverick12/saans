import type { ClientPlanWithImpact } from "@/lib/api/client-plan-schemas";
import { EXPOSURE_FACTORS } from "@/lib/impact/impact-exposure-factors";
import type { ImpactFactor, ImpactGroup } from "@/lib/impact/impact-factors";
import { collectPlanFactors } from "@/lib/impact/plan-factors";

/**
 * One switch group in the what-if panel.
 */
export interface ExposureGroup {
  group: ImpactGroup;
  legend: string;
}

/**
 * The five exposure switch groups, in display order.
 */
export const EXPOSURE_GROUP_ORDER: readonly ExposureGroup[] = [
  { group: "mask", legend: "Masks" },
  { group: "cleaner", legend: "Air cleaners" },
  { group: "ventilation", legend: "Ventilation" },
  { group: "cooking", legend: "Cooking" },
  { group: "timing", legend: "Timing" },
];

/**
 * Returns the exposure factors that belong to one switch group.
 */
export function exposureFactorsForGroup(
  group: ImpactGroup,
): readonly ImpactFactor[] {
  return EXPOSURE_FACTORS.filter((factor) => factor.group === group);
}

/**
 * Selects only the exposure factors the plan already recommends.
 */
export function initialExposureSelection(plan: ClientPlanWithImpact): string[] {
  const attached = new Set(collectPlanFactors(plan).map((factor) => factor.id));
  return EXPOSURE_FACTORS.filter((factor) => attached.has(factor.id)).map(
    (factor) => factor.id,
  );
}

/**
 * Checks whether two selected exposure factors share a group that counts once.
 */
export function hasDuplicateExposureGroups(
  selectedIds: readonly string[],
): boolean {
  const counts = new Map<string, number>();
  for (const id of selectedIds) {
    const factor = EXPOSURE_FACTORS.find((item) => item.id === id);
    if (factor === undefined) {
      continue;
    }
    counts.set(factor.group, (counts.get(factor.group) ?? 0) + 1);
  }
  return [...counts.values()].some((count) => count > 1);
}
