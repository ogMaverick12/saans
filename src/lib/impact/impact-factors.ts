import { EXPOSURE_FACTORS } from "@/lib/impact/impact-exposure-factors";
import { LIFESTYLE_FACTORS } from "@/lib/impact/impact-lifestyle-factors";
import {
  FACTOR_IDS,
  type FactorId,
  type ImpactFactor,
} from "@/lib/impact/impact-types";

export { FACTOR_IDS } from "@/lib/impact/impact-types";
export type {
  FactorId,
  ImpactConfidence,
  ImpactEffect,
  ImpactFactor,
  ImpactGroup,
  ImpactScope,
} from "@/lib/impact/impact-types";

/**
 * The approximate impact catalog used by plans and the what-if panel.
 */
export const IMPACT_FACTORS: readonly ImpactFactor[] = [
  ...EXPOSURE_FACTORS,
  ...LIFESTYLE_FACTORS,
];

/**
 * Finds a factor by ID, or undefined when the ID is unknown.
 */
export function getFactor(id: string): ImpactFactor | undefined {
  return IMPACT_FACTORS.find((factor) => factor.id === id);
}

/**
 * Checks whether a string is a known factor identifier.
 */
export function isFactorId(id: string): id is FactorId {
  return FACTOR_IDS.some((factorId) => factorId === id);
}
