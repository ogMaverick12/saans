import { describe, expect, it } from "vitest";
import {
  collectPlanFactors,
  collectTripFactors,
} from "@/lib/impact/plan-factors";
import { buildClientPlan } from "../client/client-test-data";

describe("plan factors", () => {
  it("collects each attached factor once in first-seen order", () => {
    const factors = collectPlanFactors(buildClientPlan());

    expect(factors.map((factor) => factor.id)).toEqual([
      "n95-mask",
      "hepa-purifier",
      "metro-or-bus",
    ]);
  });

  it("keeps only the trip-emission factors", () => {
    const trips = collectTripFactors(buildClientPlan());

    expect(trips.map((factor) => factor.id)).toEqual(["metro-or-bus"]);
    expect(trips[0]?.effect.kind).toBe("emission_avoided");
  });

  it("returns nothing for a plan without items", () => {
    const emptyPlan = {
      ...buildClientPlan(),
      dailyRoutine: [],
      indoorHacks: [],
      sustainableAlternatives: [],
    };

    expect(collectPlanFactors(emptyPlan)).toEqual([]);
    expect(collectTripFactors(emptyPlan)).toEqual([]);
  });
});
