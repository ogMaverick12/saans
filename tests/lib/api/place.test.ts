import { describe, expect, it } from "vitest";
import { toGeocodeMatch } from "@/lib/api/place";

describe("toGeocodeMatch", () => {
  it("maps a validated place into a geocode match", () => {
    expect(
      toGeocodeMatch({
        name: "Delhi",
        latitude: 28.61,
        longitude: 77.21,
        countryCode: "IN",
      }),
    ).toEqual({
      name: "Delhi",
      latitude: 28.61,
      longitude: 77.21,
      countryCode: "IN",
      country: null,
      admin1: null,
    });
  });

  it("keeps an unknown country code as null", () => {
    const match = toGeocodeMatch({
      name: "Somewhere",
      latitude: 0,
      longitude: 0,
      countryCode: null,
    });

    expect(match.countryCode).toBeNull();
    expect(match.country).toBeNull();
  });
});
