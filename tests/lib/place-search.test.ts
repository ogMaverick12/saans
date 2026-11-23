import { describe, expect, it } from "vitest";
import {
  describePlace,
  locationOptionId,
  placeResultAnnouncement,
} from "@/lib/place-search";

const DELHI = {
  name: "Delhi",
  latitude: 28.61,
  longitude: 77.21,
  countryCode: "IN",
  country: "India",
  admin1: "Delhi",
};

describe("place search helpers", () => {
  it("builds stable option ids and readable place details", () => {
    expect(locationOptionId("results", 2)).toBe("results-option-2");
    expect(describePlace(DELHI)).toBe("Delhi, India");
    expect(
      describePlace({
        ...DELHI,
        admin1: null,
        country: null,
      }),
    ).toBe("");
  });

  it("announces result counts in singular and plural", () => {
    expect(placeResultAnnouncement("success", 1)).toBe("1 place found.");
    expect(placeResultAnnouncement("success", 3)).toBe("3 places found.");
    expect(placeResultAnnouncement("success", 0)).toBe("0 places found.");
  });

  it("announces loading and stays quiet in other states", () => {
    expect(placeResultAnnouncement("loading", 0)).toBe("Searching for places.");
    expect(placeResultAnnouncement("idle", 0)).toBe("");
    expect(placeResultAnnouncement("error", 0)).toBe("");
  });
});
