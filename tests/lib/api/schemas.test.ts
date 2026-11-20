import { describe, expect, it } from "vitest";
import {
  AirQuerySchema,
  AskRequestSchema,
  GeocodeQuerySchema,
  HealthQuerySchema,
  PlanRequestSchema,
} from "@/lib/api/schemas";
import { buildProfile } from "../impact/test-data";
import { VALID_PLAN } from "../llm/test-data";

const PLACE = {
  name: "Delhi",
  latitude: 28.61,
  longitude: 77.21,
  countryCode: "IN",
};

describe("GeocodeQuerySchema", () => {
  it("trims a query and accepts the two-to-eighty character range", () => {
    expect(GeocodeQuerySchema.parse({ q: "  Delhi  " })).toEqual({ q: "Delhi" });
    expect(GeocodeQuerySchema.safeParse({ q: "a".repeat(80) }).success).toBe(
      true,
    );
  });

  it("rejects queries that are too short or too long", () => {
    expect(GeocodeQuerySchema.safeParse({ q: "a" }).success).toBe(false);
    expect(
      GeocodeQuerySchema.safeParse({ q: "a".repeat(81) }).success,
    ).toBe(false);
  });
});

describe("AirQuerySchema", () => {
  it("coerces coordinates and applies the default name", () => {
    const parsed = AirQuerySchema.parse({ lat: "28.61", lon: "77.21" });

    expect(parsed.lat).toBe(28.61);
    expect(parsed.lon).toBe(77.21);
    expect(parsed.name).toBe("Selected location");
  });

  it("keeps the provided name and country", () => {
    const parsed = AirQuerySchema.parse({
      lat: 28.61,
      lon: 77.21,
      name: "Delhi",
      country: "India",
    });

    expect(parsed).toMatchObject({ name: "Delhi", country: "India" });
  });

  it("rejects blank, non-numeric and out-of-range coordinates", () => {
    expect(AirQuerySchema.safeParse({ lat: "", lon: "77.21" }).success).toBe(
      false,
    );
    expect(AirQuerySchema.safeParse({ lat: "north", lon: 77.21 }).success).toBe(
      false,
    );
    expect(AirQuerySchema.safeParse({ lat: 91, lon: 77.21 }).success).toBe(
      false,
    );
    expect(AirQuerySchema.safeParse({ lat: 28.61, lon: -181 }).success).toBe(
      false,
    );
  });
});

describe("PlanRequestSchema", () => {
  it("accepts a complete plan request", () => {
    const parsed = PlanRequestSchema.parse({
      place: PLACE,
      profile: buildProfile(),
      language: "hi",
      readingMode: "simple",
    });

    expect(parsed.language).toBe("hi");
    expect(parsed.readingMode).toBe("simple");
  });

  it("rejects an unsupported language or reading mode", () => {
    expect(
      PlanRequestSchema.safeParse({
        place: PLACE,
        profile: buildProfile(),
        language: "fr",
        readingMode: "standard",
      }).success,
    ).toBe(false);
    expect(
      PlanRequestSchema.safeParse({
        place: PLACE,
        profile: buildProfile(),
        language: "en",
        readingMode: "fancy",
      }).success,
    ).toBe(false);
  });
});

describe("AskRequestSchema", () => {
  it("accepts a valid question and trims it", () => {
    const parsed = AskRequestSchema.parse({
      place: PLACE,
      question: "  Is the purifier enough?  ",
      plan: VALID_PLAN,
      language: "bn",
    });

    expect(parsed.question).toBe("Is the purifier enough?");
  });

  it("rejects a question outside the three-to-three-hundred range", () => {
    const base = { place: PLACE, plan: VALID_PLAN, language: "en" };

    expect(
      AskRequestSchema.safeParse({ ...base, question: "hi" }).success,
    ).toBe(false);
    expect(
      AskRequestSchema.safeParse({ ...base, question: "a".repeat(301) })
        .success,
    ).toBe(false);
  });
});

describe("HealthQuerySchema", () => {
  it("accepts an absent probe or probe=1", () => {
    expect(HealthQuerySchema.parse({})).toEqual({});
    expect(HealthQuerySchema.parse({ probe: "1" })).toEqual({ probe: "1" });
  });

  it("rejects any other probe value", () => {
    expect(HealthQuerySchema.safeParse({ probe: "0" }).success).toBe(false);
    expect(HealthQuerySchema.safeParse({ probe: "true" }).success).toBe(false);
  });
});
