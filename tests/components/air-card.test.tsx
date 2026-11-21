import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { AirCard } from "@/components/air-card";
import type { AqiCategory } from "@/lib/air/aqi-scales";
import { buildDigest } from "../lib/impact/test-data";

const LEVELS: AqiCategory[] = [
  { label: "Good", level: 0 },
  { label: "Moderate", level: 1 },
  { label: "Unhealthy for Sensitive Groups", level: 2 },
  { label: "Unhealthy", level: 3 },
  { label: "Very Unhealthy", level: 4 },
  { label: "Hazardous", level: 5 },
];

describe("AirCard", () => {
  it("shows the AQI value, labelled icon, PM2.5, trend and windows", () => {
    render(<AirCard digest={buildDigest()} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Today's air" }),
    ).toBeInTheDocument();
    expect(screen.getByText("165")).toBeInTheDocument();
    const badge = screen.getByText("Unhealthy").closest("span");
    const icon = badge?.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon?.getAttribute("class")).toContain("lucide-octagon-alert");
    expect(screen.getByText("100.0 µg/m³")).toBeInTheDocument();
    expect(screen.getByText("Steady")).toBeInTheDocument();
    expect(screen.getByText("1 pm to 4 pm")).toBeInTheDocument();
    expect(screen.getByText("9 pm to 12 am")).toBeInTheDocument();
  });

  it("gives every AQI level a text label and a distinct icon", () => {
    const iconClasses = LEVELS.map((category) => {
      const { container, unmount } = render(
        <AirCard digest={{ ...buildDigest(), usCategory: category }} />,
      );
      expect(screen.getByText(category.label)).toBeInTheDocument();
      const iconClass =
        container.querySelector("svg")?.getAttribute("class") ?? "";
      unmount();
      return iconClass;
    });

    expect(new Set(iconClasses).size).toBe(LEVELS.length);
  });

  it("omits the CPCB category outside India", () => {
    render(<AirCard digest={buildDigest()} />);

    expect(screen.queryByText("CPCB category")).not.toBeInTheDocument();
  });

  it("shows the CPCB category when the digest has one", () => {
    render(
      <AirCard
        digest={{
          ...buildDigest(),
          cpcbCategory: { label: "Poor", level: 3 },
        }}
      />,
    );

    expect(screen.getByText("CPCB category")).toBeInTheDocument();
    expect(screen.getByText("Poor")).toBeInTheDocument();
  });

  it("lists smog cues only when there are any", () => {
    const { rerender } = render(<AirCard digest={buildDigest()} />);
    expect(
      screen.queryByRole("heading", { level: 3, name: "Smog cues" }),
    ).not.toBeInTheDocument();

    rerender(
      <AirCard
        digest={{
          ...buildDigest(),
          smogCues: ["Haze near the road", "Smell of smoke"],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Smog cues" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Haze near the road")).toBeInTheDocument();
    expect(screen.getByText("Smell of smoke")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<AirCard digest={buildDigest()} />);

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });
});
