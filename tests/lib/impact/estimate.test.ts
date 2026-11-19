import { describe, expect, it } from "vitest";
import {
  attachImpact,
  estimateExposure,
  INDOOR_INFILTRATION,
  OUTDOOR_HOURS_BY_COMMUTE,
  tripEmissionsAvoided,
} from "@/lib/impact/estimate";
import { buildDigest, buildProfile } from "./test-data";

describe("estimateExposure", () => {
  it("equals the baseline when no factors are selected", () => {
    const estimate = estimateExposure(buildDigest(), buildProfile(), []);

    expect(estimate).toEqual({
      baselineUgM3: 72.5,
      adjustedUgM3: 72.5,
      reductionPct: 0,
      applied: [],
    });
  });

  it("changes only the outdoor part when a mask is selected", () => {
    const estimate = estimateExposure(buildDigest(), buildProfile(), [
      "n95-mask",
    ]);

    // Outdoor: 2 * 100 * 0.2 = 40. Indoor stays 22 * 70 = 1540.
    // (40 + 1540) / 24 = 65.833... -> 65.8
    expect(estimate.baselineUgM3).toBe(72.5);
    expect(estimate.adjustedUgM3).toBe(65.8);
    expect(estimate.reductionPct).toBe(9.2);
    expect(estimate.applied).toEqual(["n95-mask"]);
  });

  it("counts two selected masks once, using the stronger one", () => {
    const combined = estimateExposure(buildDigest(), buildProfile(), [
      "surgical-mask",
      "n95-mask",
    ]);
    const n95Only = estimateExposure(buildDigest(), buildProfile(), [
      "n95-mask",
    ]);

    expect(combined).toEqual(n95Only);
    expect(combined.applied).toEqual(["n95-mask"]);
  });

  it("counts two cleaners once, using the stronger one", () => {
    const estimate = estimateExposure(buildDigest(), buildProfile(), [
      "diy-box-fan-filter",
      "hepa-purifier",
    ]);

    // Indoor remaining is 1 - 0.6 = 0.4 for the HEPA purifier.
    // (200 + 22 * 70 * 0.4) / 24 = 34.0
    expect(estimate.adjustedUgM3).toBe(34);
    expect(estimate.reductionPct).toBe(53.1);
    expect(estimate.applied).toEqual(["hepa-purifier"]);
  });

  it("uses the cleanest window when shifting outdoor activity", () => {
    const estimate = estimateExposure(buildDigest(), buildProfile(), [
      "shift-outdoor-activity",
    ]);

    // (2 * 40 + 22 * 70) / 24 = 67.5
    expect(estimate.adjustedUgM3).toBe(67.5);
    expect(estimate.reductionPct).toBe(6.9);
    expect(estimate.applied).toEqual(["shift-outdoor-activity"]);
  });

  it("combines a mask with the cleanest outdoor window", () => {
    const estimate = estimateExposure(buildDigest(), buildProfile(), [
      "n95-mask",
      "shift-outdoor-activity",
    ]);

    // (2 * 40 * 0.2 + 22 * 70) / 24 = 64.833... -> 64.8
    expect(estimate.adjustedUgM3).toBe(64.8);
    expect(estimate.reductionPct).toBe(10.6);
    expect(estimate.applied).toEqual(["n95-mask", "shift-outdoor-activity"]);
  });

  it("drops unknown and non-exposure factor IDs", () => {
    const estimate = estimateExposure(buildDigest(), buildProfile(), [
      "not-a-factor",
      "walk-or-cycle",
    ]);

    expect(estimate.adjustedUgM3).toBe(estimate.baselineUgM3);
    expect(estimate.reductionPct).toBe(0);
    expect(estimate.applied).toEqual([]);
  });

  it("ignores duplicate selected IDs", () => {
    const estimate = estimateExposure(buildDigest(), buildProfile(), [
      "n95-mask",
      "n95-mask",
    ]);

    expect(estimate.applied).toEqual(["n95-mask"]);
  });

  it("keeps the requested constants available from this module", () => {
    expect(INDOOR_INFILTRATION).toBe(0.7);
    expect(OUTDOOR_HOURS_BY_COMMUTE.walk).toBe(2);
  });
});

describe("tripEmissionsAvoided", () => {
  it.each([
    { id: "walk-or-cycle", kg: 1.7 },
    { id: "metro-or-bus", kg: 1.2 },
    { id: "carpool", kg: 0.85 },
  ])("returns the saved CO2e for $id", ({ id, kg }) => {
    expect(tripEmissionsAvoided(id)).toBe(kg);
  });

  it("returns null for exposure, qualitative and unknown factors", () => {
    expect(tripEmissionsAvoided("n95-mask")).toBeNull();
    expect(tripEmissionsAvoided("avoid-open-burning")).toBeNull();
    expect(tripEmissionsAvoided("not-a-factor")).toBeNull();
  });
});

describe("attachImpact", () => {
  it("replaces known IDs with factors, drops unknown IDs and keeps the item", () => {
    const attached = attachImpact([
      {
        title: "Mask step",
        actions: ["Wear it"],
        factorIds: ["n95-mask", "gone"],
      },
      { title: "Travel", actions: [], factorIds: ["walk-or-cycle"] },
      { title: "Empty", actions: [], factorIds: [] },
    ]);

    expect(attached).toHaveLength(3);
    expect(attached[0]).toMatchObject({ title: "Mask step" });
    expect(attached[0]?.actions).toEqual(["Wear it"]);
    expect(attached[0]?.factorIds.map((factor) => factor.id)).toEqual([
      "n95-mask",
    ]);
    expect(attached[1]?.factorIds[0]?.effect.kind).toBe("emission_avoided");
    expect(attached[2]?.factorIds).toEqual([]);
  });
});
