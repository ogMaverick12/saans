import { describe, expect, it } from "vitest";
import { LIFESTYLE_FACTORS } from "@/lib/impact/impact-lifestyle-factors";
import type { ImpactFactor } from "@/lib/impact/impact-factors";

const TRIP_CASES = [
  { id: "walk-or-cycle", kg: 1.7 },
  { id: "metro-or-bus", kg: 1.2 },
  { id: "carpool", kg: 0.85 },
] as const;

/**
 * Finds a lifestyle factor or fails the test.
 */
function findLifestyleFactor(id: string): ImpactFactor {
  const factor = LIFESTYLE_FACTORS.find((candidate) => candidate.id === id);
  if (factor === undefined) {
    throw new Error(`Missing lifestyle factor ${id}`);
  }
  return factor;
}

describe("LIFESTYLE_FACTORS", () => {
  it("contains the three trip and two qualitative factors", () => {
    expect(LIFESTYLE_FACTORS.map((factor) => factor.id)).toEqual([
      "walk-or-cycle",
      "metro-or-bus",
      "carpool",
      "avoid-open-burning",
      "wet-mop-dust",
    ]);
  });

  it.each(TRIP_CASES)("keeps the starting emissions for $id", ({ id, kg }) => {
    const factor = findLifestyleFactor(id);

    expect(factor.group).toBe("commute");
    expect(factor.appliesTo).toBe("trip");
    expect(factor.effect).toEqual({
      kind: "emission_avoided",
      kgCo2ePerTrip: kg,
    });
    expect(factor.source).toBe(
      "Typical per-passenger emission factors; varies by vehicle",
    );
  });

  it("keeps the qualitative burning advice", () => {
    const factor = findLifestyleFactor("avoid-open-burning");

    expect(factor.group).toBe("waste");
    expect(factor.appliesTo).toBe("outdoor");
    expect(factor.effect.kind).toBe("qualitative");
    expect(factor.source).toBe(
      "Burning leaves, rubbish or biomass adds fine particles to the whole neighbourhood",
    );
  });

  it("keeps the qualitative wet-mopping advice", () => {
    const factor = findLifestyleFactor("wet-mop-dust");

    expect(factor.group).toBe("housekeeping");
    expect(factor.appliesTo).toBe("indoor");
    expect(factor.effect.kind).toBe("qualitative");
    expect(factor.source).toBe(
      "Wet mopping lifts less settled dust back into the air than dry sweeping",
    );
  });

  it("gives every factor a label, source and confidence", () => {
    for (const factor of LIFESTYLE_FACTORS) {
      expect(factor.label.trim()).not.toBe("");
      expect(factor.source.trim()).not.toBe("");
      expect(["approximate", "qualitative"]).toContain(factor.confidence);
    }
  });
});
