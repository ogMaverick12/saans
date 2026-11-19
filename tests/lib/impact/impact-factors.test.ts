import { describe, expect, it } from "vitest";
import {
  FACTOR_IDS,
  getFactor,
  IMPACT_FACTORS,
  isFactorId,
} from "@/lib/impact/impact-factors";

const EXPECTED_IDS = [
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
];

describe("IMPACT_FACTORS", () => {
  it("contains every starting factor in catalog order", () => {
    expect(FACTOR_IDS).toEqual(EXPECTED_IDS);
    expect(IMPACT_FACTORS.map((factor) => factor.id)).toEqual(EXPECTED_IDS);
  });

  it("has unique IDs and a source for every factor", () => {
    const ids = IMPACT_FACTORS.map((factor) => factor.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const factor of IMPACT_FACTORS) {
      expect(factor.source.trim()).not.toBe("");
      expect(factor.label.trim()).not.toBe("");
    }
  });

  it("marks every factor approximate or qualitative", () => {
    for (const factor of IMPACT_FACTORS) {
      expect(["approximate", "qualitative"]).toContain(factor.confidence);
    }
  });
});

describe("getFactor", () => {
  it("returns the catalog entry for a known ID", () => {
    const factor = getFactor("n95-mask");

    expect(factor).toBe(IMPACT_FACTORS[0]);
    expect(factor?.label).toContain("N95");
  });

  it("returns undefined for an unknown ID", () => {
    expect(getFactor("not-a-factor")).toBeUndefined();
  });
});

describe("isFactorId", () => {
  it("accepts every catalog ID", () => {
    for (const id of FACTOR_IDS) {
      expect(isFactorId(id)).toBe(true);
    }
  });

  it("rejects unknown and lookalike IDs", () => {
    expect(isFactorId("n95")).toBe(false);
    expect(isFactorId("N95-MASK")).toBe(false);
    expect(isFactorId("")).toBe(false);
  });
});
