import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { PlanView } from "@/components/plan-view";
import { buildClientPlan } from "../lib/api/client-test-data";
import { buildDigest, buildProfile } from "../lib/impact/test-data";

const PLAN = buildClientPlan();
const DIGEST = buildDigest();
const PROFILE = buildProfile();

describe("PlanView", () => {
  it("renders the five plan sections in order under the plan heading", () => {
    render(
      <PlanView
        plan={PLAN}
        digest={DIGEST}
        profile={PROFILE}
        language="hi"
        headingRef={createRef()}
      />,
    );

    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);

    expect(headings).toEqual([
      "Your plan",
      "Low-emission daily routine",
      "Indoor air quality hacks",
      "Sustainable alternatives",
      "Your impact",
      "What families and communities can do",
    ]);
  });

  it("sets the plan container language and shows the air summary", () => {
    const { container } = render(
      <PlanView
        plan={PLAN}
        digest={DIGEST}
        profile={PROFILE}
        language="bn"
        headingRef={createRef()}
      />,
    );

    const planSection = container.querySelector("section[lang='bn']");
    expect(planSection).not.toBeNull();
    expect(screen.getByText(PLAN.airSummary.headline)).toBeInTheDocument();
    expect(screen.getByText(PLAN.airSummary.explanation)).toBeInTheDocument();
  });

  it("orders the daily routine by time and shows the safety notes", () => {
    const planWithNote = {
      ...PLAN,
      doctorNote: "Talk to your doctor before changing any medicine.",
      dailyRoutine: [
        {
          timeBlock: "evening" as const,
          title: "Evening step",
          actions: ["Evening action"],
          factorIds: [],
        },
        {
          timeBlock: "early_morning" as const,
          title: "Early step",
          actions: ["Early action"],
          factorIds: [],
        },
      ],
    };
    const { container } = render(
      <PlanView
        plan={planWithNote}
        digest={DIGEST}
        profile={PROFILE}
        language="en"
        headingRef={createRef()}
      />,
    );

    const text = container.textContent ?? "";
    expect(text.indexOf("Early morning")).toBeLessThan(text.indexOf("Evening"));
    expect(
      screen.getByText("Talk to your doctor before changing any medicine."),
    ).toBeInTheDocument();
    expect(screen.getByText("Not medical advice.")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <PlanView
        plan={PLAN}
        digest={DIGEST}
        profile={PROFILE}
        language="en"
        headingRef={createRef()}
      />,
    );

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });
});
