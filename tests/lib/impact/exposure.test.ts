import { describe, expect, it } from "vitest";
import {
  calculateExposure,
  INDOOR_INFILTRATION,
  OUTDOOR_HOURS_BY_COMMUTE,
} from "@/lib/impact/exposure";
import { getFactor, type ImpactFactor } from "@/lib/impact/impact-factors";
import { buildDigest, buildProfile } from "./test-data";

/**
 * Resolves IDs to factors, failing when a test references an unknown ID.
 */
function factors(ids: string[]): ImpactFactor[] {
  return ids.map((id) => {
    const factor = getFactor(id);
    if (factor === undefined) {
      throw new Error(`Missing factor ${id}`);
    }
    return factor;
  });
}

describe("exposure constants", () => {
  it("uses the documented outdoor hours and infiltration rate", () => {
    expect(OUTDOOR_HOURS_BY_COMMUTE).toEqual({
      walk: 2,
      cycle: 2,
      two_wheeler: 1.5,
      bus: 1.5,
      metro: 1.5,
      work_from_home: 0.5,
      car: 1,
    });
    expect(INDOOR_INFILTRATION).toBe(0.7);
  });
});

describe("calculateExposure", () => {
  it("equals the baseline when no factors are selected", () => {
    const estimate = calculateExposure(buildDigest(), buildProfile(), []);

    expect(estimate).toEqual({
      baselineUgM3: 72.5,
      adjustedUgM3: 72.5,
      reductionPct: 0,
      applied: [],
    });
  });

  // Daily mean 100, walk (2 outdoor hours), infiltration 0.7:
  // baseline = (2 * 100 + 22 * 100 * 0.7) / 24 = 72.5
  // indoor remaining = (1 - 0.6) * (1 - 0.4) * (1 - 0.4) = 0.144
  // adjusted = (2 * 100 * (1 - 0.8) + 22 * 70 * 0.144) / 24 = 10.906...
  // reduction = (1 - 10.906... / 72.5) * 100 = 84.96 -> 85.0
  it("matches the hand-calculated mask, purifier, window and cooking case", () => {
    const selected = factors([
      "n95-mask",
      "hepa-purifier",
      "seal-windows-at-peak",
      "cooking-exhaust",
    ]);

    const estimate = calculateExposure(buildDigest(), buildProfile(), selected);

    expect(estimate.baselineUgM3).toBe(72.5);
    expect(estimate.adjustedUgM3).toBe(10.9);
    expect(estimate.reductionPct).toBe(85);
    expect(estimate.applied).toEqual([
      "n95-mask",
      "hepa-purifier",
      "seal-windows-at-peak",
      "cooking-exhaust",
    ]);
  });

  it("reports zero reduction when the baseline is zero", () => {
    const estimate = calculateExposure(
      buildDigest(0, 0),
      buildProfile(),
      factors(["n95-mask"]),
    );

    expect(estimate).toEqual({
      baselineUgM3: 0,
      adjustedUgM3: 0,
      reductionPct: 0,
      applied: ["n95-mask"],
    });
  });
});
