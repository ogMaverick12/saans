import { describe, expect, it } from "vitest";
import {
  EXPOSURE_GROUP_ORDER,
  exposureFactorsForGroup,
  hasDuplicateExposureGroups,
  initialExposureSelection,
} from "@/lib/impact/what-if";
import { buildClientPlan } from "../client/client-test-data";

describe("what-if helpers", () => {
  it("starts with only the exposure factors already in the plan", () => {
    expect(initialExposureSelection(buildClientPlan())).toEqual([
      "n95-mask",
      "hepa-purifier",
    ]);
  });

  it("groups exposure factors in display order", () => {
    expect(EXPOSURE_GROUP_ORDER.map((group) => group.legend)).toEqual([
      "Masks",
      "Air cleaners",
      "Ventilation",
      "Cooking",
      "Timing",
    ]);
    expect(exposureFactorsForGroup("mask")).toHaveLength(3);
    expect(
      exposureFactorsForGroup("timing").map((factor) => factor.id),
    ).toEqual(["shift-outdoor-activity"]);
  });

  it("reports a shared group only when two selected factors share one", () => {
    expect(hasDuplicateExposureGroups(["n95-mask", "surgical-mask"])).toBe(
      true,
    );
    expect(hasDuplicateExposureGroups(["n95-mask", "hepa-purifier"])).toBe(
      false,
    );
    expect(hasDuplicateExposureGroups(["n95-mask", "not-a-factor"])).toBe(
      false,
    );
    expect(hasDuplicateExposureGroups([])).toBe(false);
  });
});
