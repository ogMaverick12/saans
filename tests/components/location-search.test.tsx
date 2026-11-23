import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ searchPlaces: vi.fn() }));

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return { ...actual, searchPlaces: mocks.searchPlaces };
});

import { LocationSearch } from "@/components/location-search";

const DELHI = {
  name: "Delhi",
  latitude: 28.61,
  longitude: 77.21,
  countryCode: "IN",
  country: "India",
  admin1: "Delhi",
};

/**
 * Installs a fake geolocation implementation for one test.
 */
function installGeolocation(
  getCurrentPosition: Geolocation["getCurrentPosition"],
) {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition,
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    },
  });
}

describe("LocationSearch", () => {
  beforeEach(() => {
    mocks.searchPlaces.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: undefined,
    });
  });

  it("searches after the debounce and selects with the keyboard", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.searchPlaces.mockResolvedValue([DELHI]);
    const onSelect = vi.fn();
    render(<LocationSearch onSelect={onSelect} />);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByRole("combobox", {
      name: "Where do you live?",
    });

    await user.type(input, "De");
    expect(mocks.searchPlaces).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mocks.searchPlaces).toHaveBeenCalledTimes(1);
    expect(mocks.searchPlaces).toHaveBeenCalledWith(
      "De",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    const option = screen.getByRole("option", { name: /Delhi/ });
    expect(input).toHaveAttribute("aria-expanded", "true");
    const controls = input.getAttribute("aria-controls");
    if (controls === null) {
      throw new Error("Expected the combobox to control a listbox");
    }
    expect(document.getElementById(controls)).not.toBeNull();

    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", option.id);

    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith({
      name: "Delhi",
      latitude: 28.61,
      longitude: 77.21,
      countryCode: "IN",
    });
  });

  it("does not search for a single character", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<LocationSearch onSelect={vi.fn()} />);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByRole("combobox", {
      name: "Where do you live?",
    });

    await user.type(input, "D");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mocks.searchPlaces).not.toHaveBeenCalled();
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("shows a clear message when location permission is denied", async () => {
    const onSelect = vi.fn();
    const denied = {
      code: 1,
      message: "denied",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } satisfies GeolocationPositionError;
    installGeolocation(
      vi.fn((_success: PositionCallback, failure?: PositionErrorCallback) => {
        failure?.(denied);
      }),
    );
    render(<LocationSearch onSelect={onSelect} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Use my location" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Location permission was denied. Search for a city instead.",
    );
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("rounds a successful location to two decimals", async () => {
    const onSelect = vi.fn();
    const position = {
      coords: {
        latitude: 28.6139,
        longitude: 77.209,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: 0,
      toJSON: () => ({}),
    } satisfies GeolocationPosition;
    installGeolocation(
      vi.fn((success: PositionCallback) => {
        success(position);
      }),
    );
    render(<LocationSearch onSelect={onSelect} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Use my location" }));

    expect(onSelect).toHaveBeenCalledWith({
      name: "Your location",
      latitude: 28.61,
      longitude: 77.21,
      countryCode: null,
    });
  });

  it("has no axe violations", async () => {
    const { container } = render(<LocationSearch onSelect={vi.fn()} />);

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });
});
