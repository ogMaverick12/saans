import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders the product heading and the search starting point", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Saans" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Where do you live?" }),
    ).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Home />);

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });
});
