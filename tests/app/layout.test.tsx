import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
}));

import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders the landmarks, skip link and data attribution", () => {
    render(
      <RootLayout params={Promise.resolve({})}>
        <p>Page content</p>
      </RootLayout>,
    );

    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Page content");
    expect(screen.getByRole("contentinfo")).toHaveTextContent("CAMS ENSEMBLE");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <RootLayout params={Promise.resolve({})}>
        <p>Page content</p>
      </RootLayout>,
    );

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });
});
