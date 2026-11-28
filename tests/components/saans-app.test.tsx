import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
  searchPlaces: vi.fn(),
  fetchAirDigest: vi.fn(),
}));

vi.mock("@/lib/client/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/client/client")>();
  return {
    ...actual,
    searchPlaces: mocks.searchPlaces,
    fetchAirDigest: mocks.fetchAirDigest,
  };
});

import { SaansApp } from "@/components/saans-app";
import { buildDigest } from "../lib/impact/test-data";

const DELHI = {
  name: "Delhi",
  latitude: 28.61,
  longitude: 77.21,
  countryCode: "IN",
  country: "India",
  admin1: "Delhi",
};

describe("SaansApp", () => {
  beforeEach(() => {
    mocks.searchPlaces.mockReset();
    mocks.fetchAirDigest.mockReset();
  });

  it("disables Zod's eval-based JIT for the strict CSP", () => {
    expect(z.core.globalConfig.jitless).toBe(true);
  });

  it("starts with search and no air or profile form", () => {
    render(<SaansApp />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Check your air" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Where do you live?" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Today's air" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Tell us about your household",
      }),
    ).not.toBeInTheDocument();
  });

  it("loads today's air and reveals the profile form after a search", async () => {
    mocks.searchPlaces.mockResolvedValue([DELHI]);
    mocks.fetchAirDigest.mockResolvedValue(buildDigest());
    const user = userEvent.setup();
    render(<SaansApp />);
    const input = screen.getByRole("combobox", {
      name: "Where do you live?",
    });

    await user.type(input, "Delhi");
    const option = await screen.findByRole(
      "option",
      { name: /Delhi/ },
      { timeout: 2_000 },
    );
    await user.click(option);

    expect(
      await screen.findByRole("heading", { level: 2, name: "Today's air" }),
    ).toBeInTheDocument();
    expect(screen.getByText("165")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Tell us about your household",
      }),
    ).toBeInTheDocument();
    expect(input).toHaveValue("Delhi");
    expect(mocks.fetchAirDigest).toHaveBeenCalledWith(
      {
        name: "Delhi",
        latitude: 28.61,
        longitude: 77.21,
        countryCode: "IN",
      },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("shows a retryable error when the air request fails", async () => {
    mocks.searchPlaces.mockResolvedValue([DELHI]);
    mocks.fetchAirDigest.mockRejectedValue(
      new Error("Upstream air data is unavailable."),
    );
    const user = userEvent.setup();
    render(<SaansApp />);
    const input = screen.getByRole("combobox", {
      name: "Where do you live?",
    });

    await user.type(input, "Delhi");
    const option = await screen.findByRole(
      "option",
      { name: /Delhi/ },
      { timeout: 2_000 },
    );
    await user.click(option);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("We could not load today's air");
    expect(alert).toHaveTextContent("Something went wrong. Please try again.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });

  it("has no axe violations", async () => {
    const { container } = render(<SaansApp />);

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });
});
