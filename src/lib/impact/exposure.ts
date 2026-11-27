import type { AirDigest } from "@/lib/air/digest-schema";
import type { ImpactFactor, ImpactGroup } from "@/lib/impact/impact-types";
import type { Commute, Profile } from "@/lib/profile/schema";

const HOURS_PER_DAY = 24;
const PERCENT = 100;
const ROUNDING_FACTOR = 10;
const INDOOR_GROUPS = ["cleaner", "ventilation", "cooking"] as const;

/**
 * Hours per day spent outdoors by commute mode.
 */
export const OUTDOOR_HOURS_BY_COMMUTE: Readonly<Record<Commute, number>> = {
  walk: 2,
  cycle: 2,
  two_wheeler: 1.5,
  bus: 1.5,
  metro: 1.5,
  work_from_home: 0.5,
  car: 1,
};

/**
 * Fraction of outdoor PM2.5 that reaches indoor air.
 */
export const INDOOR_INFILTRATION = 0.7;

/**
 * Result of comparing baseline exposure with selected factors.
 */
export interface ExposureEstimate {
  baselineUgM3: number;
  adjustedUgM3: number;
  reductionPct: number;
  applied: string[];
}

function roundOne(value: number): number {
  return Math.round(value * ROUNDING_FACTOR) / ROUNDING_FACTOR;
}

function typicalPct(factor: ImpactFactor): number {
  return factor.effect.kind === "exposure_reduction"
    ? factor.effect.typicalPct
    : 0;
}

function isPresent<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function bestInGroup(
  factors: readonly ImpactFactor[],
  group: ImpactGroup,
): ImpactFactor | undefined {
  let best: ImpactFactor | undefined;
  for (const factor of factors) {
    if (factor.group !== group) {
      continue;
    }
    if (best === undefined || typicalPct(factor) > typicalPct(best)) {
      best = factor;
    }
  }
  return best;
}

function combinedReduction(factors: readonly ImpactFactor[]): number {
  return (
    1 -
    factors.reduce(
      (remaining, factor) => remaining * (1 - typicalPct(factor) / PERCENT),
      1,
    )
  );
}

function exposureAt(
  outdoorHours: number,
  outdoorPm25: number,
  indoorPm25: number,
  maskReduction: number,
  indoorReduction: number,
): number {
  const outdoor = outdoorHours * outdoorPm25 * (1 - maskReduction);
  const indoor = (HOURS_PER_DAY - outdoorHours) * indoorPm25;
  return (outdoor + indoor * (1 - indoorReduction)) / HOURS_PER_DAY;
}

function contributedIds(
  selected: readonly ImpactFactor[],
  contributing: readonly (ImpactFactor | undefined)[],
): string[] {
  const ids = new Set(
    contributing.filter(isPresent).map((factor) => factor.id),
  );
  return selected
    .filter((factor) => ids.has(factor.id))
    .map((factor) => factor.id);
}

/**
 * Applies selected factors to a digest and returns the rounded estimate.
 */
export function calculateExposure(
  digest: AirDigest,
  profile: Profile,
  selected: readonly ImpactFactor[],
): ExposureEstimate {
  const mask = bestInGroup(selected, "mask");
  const indoor = INDOOR_GROUPS.map((group) =>
    bestInGroup(selected, group),
  ).filter(isPresent);
  const shift = selected.find(
    (factor) => factor.id === "shift-outdoor-activity",
  );
  const outdoorPm25 = shift
    ? digest.cleanestWindow.meanPm25
    : digest.dailyMeanPm25;
  const indoorPm25 = digest.dailyMeanPm25 * INDOOR_INFILTRATION;
  const outdoorHours = OUTDOOR_HOURS_BY_COMMUTE[profile.commute];
  const baseline = exposureAt(
    outdoorHours,
    digest.dailyMeanPm25,
    indoorPm25,
    0,
    0,
  );
  const adjusted = exposureAt(
    outdoorHours,
    outdoorPm25,
    indoorPm25,
    mask ? typicalPct(mask) / PERCENT : 0,
    combinedReduction(indoor),
  );

  return {
    baselineUgM3: roundOne(baseline),
    adjustedUgM3: roundOne(adjusted),
    reductionPct:
      baseline === 0 ? 0 : roundOne((1 - adjusted / baseline) * PERCENT),
    applied: contributedIds(selected, [mask, shift, ...indoor]),
  };
}
