import { describe, expect, it } from "vitest";
import {
  AREA_LABELS,
  buildReadAloudText,
  COST_LABELS,
  EFFORT_LABELS,
  READ_ALOUD_LANGUAGES,
  sortByTimeBlock,
  TIME_BLOCK_LABELS,
} from "@/components/plan/plan-display";
import { VALID_PLAN } from "../../lib/llm/test-data";

describe("plan display", () => {
  it("sorts routine items from earliest to latest", () => {
    const sorted = sortByTimeBlock([
      { timeBlock: "night" as const, title: "Night" },
      { timeBlock: "morning" as const, title: "Morning" },
      { timeBlock: "early_morning" as const, title: "Early" },
    ]);

    expect(sorted.map((item) => item.timeBlock)).toEqual([
      "early_morning",
      "morning",
      "night",
    ]);
  });

  it("labels every time block, cost, effort and area", () => {
    expect(TIME_BLOCK_LABELS.midday).toBe("Midday");
    expect(COST_LABELS.high).toBe("High cost");
    expect(EFFORT_LABELS.involved).toBe("Involved");
    expect(AREA_LABELS.waste).toBe("Waste");
  });

  it("reads the headline, time-ordered routine and hacks only", () => {
    const text = buildReadAloudText(VALID_PLAN);

    expect(text).toContain(VALID_PLAN.airSummary.headline);
    expect(text.indexOf("Check the air before going out")).toBeLessThan(
      text.indexOf("Wear a fitted mask on the commute"),
    );
    expect(text).toContain("Run the purifier in the room you use most");
    expect(text).not.toContain(VALID_PLAN.airSummary.explanation);
    expect(READ_ALOUD_LANGUAGES).toEqual({
      en: "en-IN",
      hi: "hi-IN",
      bn: "bn-IN",
    });
  });

  it("reads only the headline when there is no routine or hacks", () => {
    const text = buildReadAloudText({
      airSummary: { headline: "Clear skies" },
      dailyRoutine: [],
      indoorHacks: [],
    });

    expect(text).toBe("Clear skies");
  });
});
