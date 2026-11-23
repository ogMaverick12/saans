import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ImpactBadge } from "@/components/impact-badge";
import { IMPACT_FACTORS, type ImpactFactor } from "@/lib/impact/impact-factors";

/**
 * Returns a catalog factor or fails when the catalog is incomplete.
 */
function factor(id: string): ImpactFactor {
  const found = IMPACT_FACTORS.find((item) => item.id === id);
  if (found === undefined) {
    throw new Error(`Expected the impact catalog to contain ${id}`);
  }
  return found;
}

describe("ImpactBadge", () => {
  it("shows the exposure-reduction range with an estimate and source", () => {
    const n95 = factor("n95-mask");
    render(<ImpactBadge factor={n95} />);

    expect(screen.getByText(n95.label)).toBeInTheDocument();
    expect(screen.getByText("Estimate")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Typically cuts what you breathe in by about 80% (range 50-95%)",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Source")).toBeInTheDocument();
    expect(screen.getByText(n95.source)).toBeInTheDocument();
  });

  it("shows the avoided trip emissions", () => {
    const metro = factor("metro-or-bus");
    render(<ImpactBadge factor={metro} />);

    expect(
      screen.getByText(
        "Avoids about 1.2 kg CO2e per 10 km trip compared with driving alone",
      ),
    ).toBeInTheDocument();
  });

  it("shows a qualitative factor's note", () => {
    const mop = factor("wet-mop-dust");
    render(<ImpactBadge factor={mop} />);

    expect(
      screen.getByText(
        "Wet cleaning removes settled dust without stirring it back into the air.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the computed timing estimate", () => {
    render(<ImpactBadge factor={factor("shift-outdoor-activity")} />);

    expect(
      screen.getByText("Estimated from today's cleanest forecast window."),
    ).toBeInTheDocument();
  });
});
