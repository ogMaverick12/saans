import { describe, expect, it } from "vitest";
import { AskSchema, PlanSchema } from "@/lib/llm/plan-schema";
import { VALID_ASK, VALID_PLAN } from "./test-data";

const TITLE_LIMIT = 80;
const TEXT_LIMIT = 280;
const ANSWER_LIMIT = 600;

describe("PlanSchema", () => {
  it("accepts a complete plan with null notes", () => {
    const plan = PlanSchema.parse(VALID_PLAN);

    expect(plan).toEqual(VALID_PLAN);
    expect(plan.doctorNote).toBeNull();
    expect(plan.airSummary.sensitiveGroupNote).not.toBeNull();
  });

  it("accepts titles and text at the documented limits", () => {
    const plan = PlanSchema.parse({
      ...VALID_PLAN,
      airSummary: {
        ...VALID_PLAN.airSummary,
        headline: "a".repeat(TITLE_LIMIT),
        explanation: "b".repeat(TEXT_LIMIT),
        sensitiveGroupNote: null,
      },
      doctorNote: null,
    });

    expect(plan.airSummary.headline).toHaveLength(TITLE_LIMIT);
    expect(plan.airSummary.explanation).toHaveLength(TEXT_LIMIT);
  });

  it("rejects unknown keys at the top level and inside items", () => {
    expect(PlanSchema.safeParse({ ...VALID_PLAN, extra: true }).success).toBe(
      false,
    );
    expect(
      PlanSchema.safeParse({
        ...VALID_PLAN,
        dailyRoutine: [
          { ...VALID_PLAN.dailyRoutine[0], extra: true },
          ...VALID_PLAN.dailyRoutine.slice(1),
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects too few or too many routine items", () => {
    expect(
      PlanSchema.safeParse({
        ...VALID_PLAN,
        dailyRoutine: VALID_PLAN.dailyRoutine.slice(0, 3),
      }).success,
    ).toBe(false);
    expect(
      PlanSchema.safeParse({
        ...VALID_PLAN,
        dailyRoutine: [
          ...VALID_PLAN.dailyRoutine,
          VALID_PLAN.dailyRoutine[0],
          VALID_PLAN.dailyRoutine[0],
          VALID_PLAN.dailyRoutine[0],
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects an empty or oversized action list", () => {
    expect(
      PlanSchema.safeParse({
        ...VALID_PLAN,
        dailyRoutine: [
          { ...VALID_PLAN.dailyRoutine[0], actions: [] },
          ...VALID_PLAN.dailyRoutine.slice(1),
        ],
      }).success,
    ).toBe(false);
    expect(
      PlanSchema.safeParse({
        ...VALID_PLAN,
        dailyRoutine: [
          {
            ...VALID_PLAN.dailyRoutine[0],
            actions: ["a", "b", "c", "d"],
          },
          ...VALID_PLAN.dailyRoutine.slice(1),
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects an oversized title or body string", () => {
    expect(
      PlanSchema.safeParse({
        ...VALID_PLAN,
        airSummary: {
          ...VALID_PLAN.airSummary,
          headline: "a".repeat(TITLE_LIMIT + 1),
        },
      }).success,
    ).toBe(false);
    expect(
      PlanSchema.safeParse({
        ...VALID_PLAN,
        airSummary: {
          ...VALID_PLAN.airSummary,
          explanation: "b".repeat(TEXT_LIMIT + 1),
        },
      }).success,
    ).toBe(false);
  });

  it("rejects unknown time blocks, costs, efforts and areas", () => {
    const badTimeBlock = {
      ...VALID_PLAN,
      dailyRoutine: [
        { ...VALID_PLAN.dailyRoutine[0], timeBlock: "dawn" },
        ...VALID_PLAN.dailyRoutine.slice(1),
      ],
    };
    const badCost = {
      ...VALID_PLAN,
      indoorHacks: [
        { ...VALID_PLAN.indoorHacks[0], cost: "expensive" },
        ...VALID_PLAN.indoorHacks.slice(1),
      ],
    };
    const badEffort = {
      ...VALID_PLAN,
      indoorHacks: [
        { ...VALID_PLAN.indoorHacks[0], effort: "hard" },
        ...VALID_PLAN.indoorHacks.slice(1),
      ],
    };
    const badArea = {
      ...VALID_PLAN,
      sustainableAlternatives: [
        { ...VALID_PLAN.sustainableAlternatives[0], area: "garden" },
        ...VALID_PLAN.sustainableAlternatives.slice(1),
      ],
    };

    for (const candidate of [badTimeBlock, badCost, badEffort, badArea]) {
      expect(PlanSchema.safeParse(candidate).success).toBe(false);
    }
  });

  it("rejects too few indoor, sustainable and community items", () => {
    expect(
      PlanSchema.safeParse({
        ...VALID_PLAN,
        indoorHacks: VALID_PLAN.indoorHacks.slice(0, 2),
      }).success,
    ).toBe(false);
    expect(
      PlanSchema.safeParse({
        ...VALID_PLAN,
        sustainableAlternatives: VALID_PLAN.sustainableAlternatives.slice(0, 2),
      }).success,
    ).toBe(false);
    expect(
      PlanSchema.safeParse({
        ...VALID_PLAN,
        communityActions: VALID_PLAN.communityActions.slice(0, 1),
      }).success,
    ).toBe(false);
  });
});

describe("AskSchema", () => {
  it("accepts an answer with follow-ups", () => {
    expect(AskSchema.parse(VALID_ASK)).toEqual(VALID_ASK);
  });

  it("accepts an empty follow-up list", () => {
    const ask = AskSchema.parse({ answer: "Short answer.", followUps: [] });

    expect(ask.followUps).toEqual([]);
  });

  it("rejects a long answer, too many follow-ups and unknown keys", () => {
    expect(
      AskSchema.safeParse({
        answer: "a".repeat(ANSWER_LIMIT + 1),
        followUps: [],
      }).success,
    ).toBe(false);
    expect(
      AskSchema.safeParse({
        answer: "ok",
        followUps: ["a", "b", "c", "d"],
      }).success,
    ).toBe(false);
    expect(
      AskSchema.safeParse({ answer: "ok", followUps: [], extra: true }).success,
    ).toBe(false);
  });
});
