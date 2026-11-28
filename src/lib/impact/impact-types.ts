import { z } from "zod";

/**
 * Every factor identifier the plan and what-if panel may use.
 */
export const FACTOR_IDS = [
  "n95-mask",
  "surgical-mask",
  "cloth-mask",
  "hepa-purifier",
  "diy-box-fan-filter",
  "seal-windows-at-peak",
  "cooking-exhaust",
  "clean-cooking-fuel",
  "shift-outdoor-activity",
  "walk-or-cycle",
  "metro-or-bus",
  "carpool",
  "avoid-open-burning",
  "wet-mop-dust",
] as const;

export type FactorId = (typeof FACTOR_IDS)[number];

/**
 * Where a factor's benefit is felt.
 */
export type ImpactScope = "outdoor" | "indoor" | "trip";

/**
 * Habit groups an impact factor can belong to.
 */
export const IMPACT_GROUPS = z.enum([
  "mask",
  "cleaner",
  "ventilation",
  "cooking",
  "timing",
  "commute",
  "waste",
  "housekeeping",
]);

export type ImpactGroup = z.infer<typeof IMPACT_GROUPS>;

/**
 * How strongly the catalog stands behind a factor.
 */
export type ImpactConfidence = "approximate" | "qualitative";

/**
 * The numeric or descriptive effect attached to a factor.
 */
export type ImpactEffect =
  | {
      kind: "exposure_reduction";
      lowPct: number;
      typicalPct: number;
      highPct: number;
    }
  | { kind: "emission_avoided"; kgCo2ePerTrip: number }
  | { kind: "computed" }
  | { kind: "qualitative"; note: string };

export interface ImpactFactor {
  id: FactorId;
  label: string;
  group: ImpactGroup;
  appliesTo: ImpactScope;
  effect: ImpactEffect;
  source: string;
  confidence: ImpactConfidence;
}

/**
 * Result of comparing baseline exposure with selected factors.
 */
export interface ExposureEstimate {
  baselineUgM3: number;
  adjustedUgM3: number;
  reductionPct: number;
  applied: string[];
}
