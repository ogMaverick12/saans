import type { AirDigest } from "@/lib/air/schemas";
import {
  calculateExposure,
  type ExposureEstimate,
} from "@/lib/impact/exposure";
import {
  getFactor,
  IMPACT_FACTORS,
  type ImpactFactor,
} from "@/lib/impact/impact-factors";
import type { Profile } from "@/lib/profile/schema";

export {
  INDOOR_INFILTRATION,
  OUTDOOR_HOURS_BY_COMMUTE,
  type ExposureEstimate,
} from "@/lib/impact/exposure";

/**
 * One item whose factor IDs should be replaced with catalog factors.
 */
export interface ImpactItem {
  factorIds: readonly string[];
}

/**
 * An item whose factor IDs have been resolved to catalog factors.
 */
export type AttachedImpactItem<T extends ImpactItem> = Omit<T, "factorIds"> & {
  factorIds: ImpactFactor[];
};

/**
 * Estimates average daily PM2.5 exposure with and without selected factors.
 */
export function estimateExposure(
  digest: AirDigest,
  profile: Profile,
  selectedFactorIds: readonly string[],
): ExposureEstimate {
  const wanted = new Set(selectedFactorIds);
  const selected = IMPACT_FACTORS.filter((factor) => wanted.has(factor.id));
  return calculateExposure(digest, profile, selected);
}

/**
 * Returns the CO2e avoided by a low-emission trip factor, or null.
 */
export function tripEmissionsAvoided(factorId: string): number | null {
  const effect = getFactor(factorId)?.effect;
  return effect?.kind === "emission_avoided" ? effect.kgCo2ePerTrip : null;
}

/**
 * Replaces each item's factor IDs with catalog factors and drops unknown IDs.
 */
export function attachImpact<T extends ImpactItem>(
  items: readonly T[],
): AttachedImpactItem<T>[] {
  return items.map(({ factorIds, ...rest }) => ({
    ...rest,
    factorIds: factorIds
      .map((id) => getFactor(id))
      .filter((factor): factor is ImpactFactor => factor !== undefined),
  }));
}
