import { describe, expect, it } from "vitest";
import {
  ImpactFactorSchema,
  PlanResponseSchema,
} from "@/lib/client/client-plan-schemas";
import { buildDigest } from "../impact/test-data";
import { buildClientPlan } from "./client-test-data";

describe("client plan schemas", () => {
  it("parses a plan response with attached factors", () => {
    const parsed = PlanResponseSchema.safeParse({
      plan: buildClientPlan(),
      digest: buildDigest(),
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects an unknown factor id", () => {
    const plan = buildClientPlan();
    const firstItem = plan.dailyRoutine[0];
    if (firstItem === undefined) {
      throw new Error("Expected a daily routine item");
    }
    const factor = firstItem.factorIds[0];
    if (factor === undefined) {
      throw new Error("Expected an attached factor");
    }

    const parsed = ImpactFactorSchema.safeParse({
      ...factor,
      id: "not-a-factor",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects a plan without a doctor note field", () => {
    const plan: Record<string, unknown> = { ...buildClientPlan() };
    delete plan.doctorNote;

    expect(
      PlanResponseSchema.safeParse({ plan, digest: buildDigest() }).success,
    ).toBe(false);
  });
});
