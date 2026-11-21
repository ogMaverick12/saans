import { describe, expect, it } from "vitest";
import {
  AirDigestSchema,
  AqiLevelSchema,
  GeocodeMatchSchema,
} from "@/lib/api/client-schemas";
import { buildDigest } from "../../lib/impact/test-data";

const DELHI = {
  name: "Delhi",
  latitude: 28.61,
  longitude: 77.21,
  countryCode: "IN",
  country: "India",
  admin1: "Delhi",
};

describe("client air schemas", () => {
  it("parses a complete air digest", () => {
    const parsed = AirDigestSchema.safeParse(buildDigest());

    expect(parsed.success).toBe(true);
  });

  it("accepts the six AQI levels and rejects a seventh", () => {
    expect(AqiLevelSchema.safeParse(0).success).toBe(true);
    expect(AqiLevelSchema.safeParse(5).success).toBe(true);
    expect(AqiLevelSchema.safeParse(6).success).toBe(false);
  });

  it("rejects a digest with an out-of-range level", () => {
    const digest = {
      ...buildDigest(),
      usCategory: { label: "Unknown", level: 9 },
    };

    expect(AirDigestSchema.safeParse(digest).success).toBe(false);
  });

  it("parses a geocoding match with nullable country fields", () => {
    const parsed = GeocodeMatchSchema.safeParse({
      ...DELHI,
      countryCode: null,
      country: null,
      admin1: null,
    });

    expect(parsed.success).toBe(true);
  });
});
