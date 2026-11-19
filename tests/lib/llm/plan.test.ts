import { describe, expect, it } from "vitest";
import { answerQuestion, generatePlan } from "@/lib/llm/plan";
import { buildDigest, buildProfile } from "../impact/test-data";
import { FakeLlmClient, VALID_ASK, VALID_PLAN } from "./test-data";

describe("generatePlan", () => {
  it("attaches catalog factors, drops unknown IDs and returns the digest", async () => {
    const client = new FakeLlmClient([JSON.stringify(VALID_PLAN)]);
    const digest = buildDigest();

    const result = await generatePlan({
      client,
      digest,
      profile: buildProfile("walk"),
      language: "en",
      readingMode: "standard",
    });

    expect(result.digest).toBe(digest);
    expect(result.plan.airSummary).toEqual(VALID_PLAN.airSummary);
    expect(result.plan.communityActions).toEqual(VALID_PLAN.communityActions);

    const firstRoutineItem = result.plan.dailyRoutine[0];
    expect(firstRoutineItem?.factorIds.map((factor) => factor.id)).toEqual([
      "shift-outdoor-activity",
    ]);
    expect(firstRoutineItem?.factorIds[0]?.effect.kind).toBe("computed");
    expect(
      result.plan.dailyRoutine[1]?.factorIds.map((factor) => factor.id),
    ).toEqual(["n95-mask"]);
    expect(
      result.plan.indoorHacks[0]?.factorIds.map((factor) => factor.id),
    ).toEqual(["hepa-purifier"]);
    expect(
      result.plan.sustainableAlternatives[0]?.factorIds.map(
        (factor) => factor.id,
      ),
    ).toEqual(["walk-or-cycle"]);
  });

  it("sends the digest, profile and factor catalog to the model", async () => {
    const client = new FakeLlmClient([JSON.stringify(VALID_PLAN)]);

    await generatePlan({
      client,
      digest: buildDigest(),
      profile: buildProfile("cycle"),
      language: "hi",
      readingMode: "simple",
    });

    const request = client.requests[0];
    expect(request?.maxOutputTokens).toBeGreaterThan(0);
    expect(request?.system).toContain("Requested language: Hindi (hi).");
    expect(request?.system).toContain("Reading mode: simple.");
    expect(request?.user).toContain('"usAqi":165');
    expect(request?.user).toContain('"commute":"cycle"');
    expect(request?.user).toContain("hepa-purifier:");
  });

  it("fails with LLM_BAD_OUTPUT when the plan never validates", async () => {
    const client = new FakeLlmClient(["{}", "{}"]);

    await expect(
      generatePlan({
        client,
        digest: buildDigest(),
        profile: buildProfile(),
        language: "en",
        readingMode: "standard",
      }),
    ).rejects.toMatchObject({ code: "LLM_BAD_OUTPUT" });
  });
});

describe("answerQuestion", () => {
  it("returns the validated answer and wraps the question in tags", async () => {
    const client = new FakeLlmClient([JSON.stringify(VALID_ASK)]);

    const answer = await answerQuestion({
      client,
      question: "Is the evening better?",
      digest: buildDigest(),
      plan: VALID_PLAN,
      language: "bn",
    });

    expect(answer).toEqual(VALID_ASK);
    expect(client.requests[0]?.user).toContain(
      "<question>Is the evening better?</question>",
    );
    expect(client.requests[0]?.system).toContain(
      "Requested language: Bengali (bn).",
    );
    expect(client.requests[0]?.maxOutputTokens).toBeGreaterThan(0);
  });

  it("fails with LLM_BAD_OUTPUT for an invalid answer", async () => {
    const client = new FakeLlmClient([
      JSON.stringify({ answer: "", followUps: [] }),
      JSON.stringify({ answer: "", followUps: [] }),
    ]);

    await expect(
      answerQuestion({
        client,
        question: "Is the evening better?",
        digest: buildDigest(),
        plan: VALID_PLAN,
        language: "en",
      }),
    ).rejects.toMatchObject({ code: "LLM_BAD_OUTPUT" });
  });
});
