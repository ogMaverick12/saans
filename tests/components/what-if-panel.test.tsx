import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { WhatIfPanel } from "@/components/what-if-panel";
import { estimateExposure } from "@/lib/impact/estimate";
import { buildClientPlan } from "../lib/api/client-test-data";
import { buildDigest, buildProfile } from "../lib/impact/test-data";

const PLAN = buildClientPlan();
const DIGEST = buildDigest();
const PROFILE = buildProfile();
const INITIAL_IDS = ["n95-mask", "hepa-purifier"];

describe("WhatIfPanel", () => {
  it("shows the same numbers as estimateExposure for the plan's factors", () => {
    const expected = estimateExposure(DIGEST, PROFILE, INITIAL_IDS);
    render(<WhatIfPanel digest={DIGEST} profile={PROFILE} plan={PLAN} />);

    expect(
      screen.getByText(`${expected.baselineUgM3.toFixed(1)} µg/m³`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${expected.adjustedUgM3.toFixed(1)} µg/m³`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `These choices could cut your average daily exposure by about ${expected.reductionPct}%.`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/1.2 kg CO2e per 10 km trip/)).toBeInTheDocument();
  });

  it("updates the estimate and announces a shared group", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <WhatIfPanel digest={DIGEST} profile={PROFILE} plan={PLAN} />,
    );

    await user.click(
      screen.getByRole("switch", { name: "Wear a surgical mask" }),
    );

    const expected = estimateExposure(DIGEST, PROFILE, [
      ...INITIAL_IDS,
      "surgical-mask",
    ]);
    expect(
      screen.getByText(`${expected.adjustedUgM3.toFixed(1)} µg/m³`),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Counts once, with the stronger choice.").length,
    ).toBeGreaterThan(0);

    await waitFor(
      () => {
        const live = container.querySelector('[aria-live="polite"]');
        expect(live).not.toBeNull();
        expect(live).toHaveTextContent(
          "Counts once, with the stronger choice.",
        );
      },
      { timeout: 2_000 },
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <WhatIfPanel digest={DIGEST} profile={PROFILE} plan={PLAN} />,
    );

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });
});
