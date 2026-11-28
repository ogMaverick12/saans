import { describe, expect, it } from "vitest";
import { toAskPlan } from "@/lib/api/ask-plan";
import { buildClientPlan } from "../client/client-test-data";

describe("toAskPlan", () => {
  it("replaces attached factors with their identifiers", () => {
    const plain = toAskPlan(buildClientPlan());

    expect(plain.dailyRoutine).toHaveLength(1);
    expect(plain.dailyRoutine[0]?.factorIds).toEqual(["n95-mask"]);
    expect(plain.indoorHacks[0]?.factorIds).toEqual(["hepa-purifier"]);
    expect(plain.sustainableAlternatives[0]?.factorIds).toEqual([
      "metro-or-bus",
    ]);
    expect(plain.doctorNote).toBeNull();
  });

  it("does not mutate the client plan", () => {
    const plan = buildClientPlan();

    toAskPlan(plan);

    expect(plan.dailyRoutine[0]?.factorIds[0]?.id).toBe("n95-mask");
  });

  it("handles a plan with empty sections", () => {
    const plain = toAskPlan({
      ...buildClientPlan(),
      dailyRoutine: [],
      indoorHacks: [],
      sustainableAlternatives: [],
    });

    expect(plain.dailyRoutine).toEqual([]);
    expect(plain.indoorHacks).toEqual([]);
    expect(plain.sustainableAlternatives).toEqual([]);
  });
});
