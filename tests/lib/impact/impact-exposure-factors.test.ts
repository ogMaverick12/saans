import { describe, expect, it } from "vitest";
import { EXPOSURE_FACTORS } from "@/lib/impact/impact-exposure-factors";
import type { ImpactFactor } from "@/lib/impact/impact-factors";

const REDUCTION_CASES = [
  {
    id: "n95-mask",
    group: "mask",
    scope: "outdoor",
    low: 50,
    typical: 80,
    high: 95,
  },
  {
    id: "surgical-mask",
    group: "mask",
    scope: "outdoor",
    low: 5,
    typical: 20,
    high: 35,
  },
  {
    id: "cloth-mask",
    group: "mask",
    scope: "outdoor",
    low: 0,
    typical: 10,
    high: 25,
  },
  {
    id: "hepa-purifier",
    group: "cleaner",
    scope: "indoor",
    low: 40,
    typical: 60,
    high: 80,
  },
  {
    id: "diy-box-fan-filter",
    group: "cleaner",
    scope: "indoor",
    low: 30,
    typical: 50,
    high: 70,
  },
  {
    id: "seal-windows-at-peak",
    group: "ventilation",
    scope: "indoor",
    low: 20,
    typical: 40,
    high: 60,
  },
  {
    id: "cooking-exhaust",
    group: "cooking",
    scope: "indoor",
    low: 20,
    typical: 40,
    high: 60,
  },
  {
    id: "clean-cooking-fuel",
    group: "cooking",
    scope: "indoor",
    low: 40,
    typical: 60,
    high: 90,
  },
] as const;

/**
 * Finds an exposure factor or fails the test.
 */
function findExposureFactor(id: string): ImpactFactor {
  const factor = EXPOSURE_FACTORS.find((candidate) => candidate.id === id);
  if (factor === undefined) {
    throw new Error(`Missing exposure factor ${id}`);
  }
  return factor;
}

describe("EXPOSURE_FACTORS", () => {
  it("contains the nine mask, indoor and timing factors", () => {
    expect(EXPOSURE_FACTORS.map((factor) => factor.id)).toEqual([
      "n95-mask",
      "surgical-mask",
      "cloth-mask",
      "hepa-purifier",
      "diy-box-fan-filter",
      "seal-windows-at-peak",
      "cooking-exhaust",
      "clean-cooking-fuel",
      "shift-outdoor-activity",
    ]);
  });

  it.each(REDUCTION_CASES)(
    "keeps the starting reduction values for $id",
    ({ id, group, scope, low, typical, high }) => {
      const factor = findExposureFactor(id);

      expect(factor.group).toBe(group);
      expect(factor.appliesTo).toBe(scope);
      expect(factor.effect).toEqual({
        kind: "exposure_reduction",
        lowPct: low,
        typicalPct: typical,
        highPct: high,
      });
    },
  );

  it("keeps the computed shift factor", () => {
    const factor = findExposureFactor("shift-outdoor-activity");

    expect(factor.group).toBe("timing");
    expect(factor.appliesTo).toBe("outdoor");
    expect(factor.effect).toEqual({ kind: "computed" });
    expect(factor.source).toBe(
      "Compares the cleanest forecast window with the daily mean",
    );
  });

  it("gives every factor a label, source and approximate confidence", () => {
    for (const factor of EXPOSURE_FACTORS) {
      expect(factor.label.trim()).not.toBe("");
      expect(factor.source.trim()).not.toBe("");
      expect(factor.confidence).toBe("approximate");
    }
  });
});
