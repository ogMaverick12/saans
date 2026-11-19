import { describe, expect, it } from "vitest";
import { FREE_TEXT_MAX_CHARS } from "@/lib/config";
import { ProfileSchema, type Profile } from "@/lib/profile/schema";

const VALID_PROFILE = {
  household: ["young_children", "older_adults"],
  commute: "walk",
  homeType: "apartment",
  hasPurifier: true,
  hasAirConditioner: false,
  cookingFuel: "lpg",
  heating: "none",
  budget: "medium",
} as const;

describe("ProfileSchema", () => {
  it("accepts a complete profile and infers the Profile type", () => {
    const profile: Profile = ProfileSchema.parse(VALID_PROFILE);

    expect(profile).toEqual(VALID_PROFILE);
  });

  it("defaults the household to an empty list", () => {
    const profile = ProfileSchema.parse({
      ...VALID_PROFILE,
      household: undefined,
    });

    expect(profile.household).toEqual([]);
  });

  it("accepts every documented profile shape", () => {
    const profile = {
      ...VALID_PROFILE,
      household: ["pregnancy", "lung_condition", "heart_condition"],
      commute: "two_wheeler",
      homeType: "shared_room",
      cookingFuel: "biomass",
      heating: "wood_or_coal",
      budget: "low",
    };

    expect(ProfileSchema.parse(profile)).toMatchObject(profile);
  });

  it("sanitises the optional note", () => {
    const profile = ProfileSchema.parse({
      ...VALID_PROFILE,
      note: "  smoke   <b>  ",
    });

    expect(profile.note).toBe("smoke b");
  });

  it("truncates a long note to the configured limit", () => {
    const profile = ProfileSchema.parse({
      ...VALID_PROFILE,
      note: "a".repeat(FREE_TEXT_MAX_CHARS + 50),
    });

    expect(profile.note).toHaveLength(FREE_TEXT_MAX_CHARS);
  });

  it("leaves an omitted note undefined", () => {
    const profile = ProfileSchema.parse(VALID_PROFILE);

    expect(profile.note).toBeUndefined();
  });

  it("rejects an unknown commute mode", () => {
    const result = ProfileSchema.safeParse({
      ...VALID_PROFILE,
      commute: "rocket",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an unknown household member", () => {
    const result = ProfileSchema.safeParse({
      ...VALID_PROFILE,
      household: ["visiting_aliens"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate household members", () => {
    const result = ProfileSchema.safeParse({
      ...VALID_PROFILE,
      household: ["young_children", "young_children"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects more than five household members", () => {
    const result = ProfileSchema.safeParse({
      ...VALID_PROFILE,
      household: [
        "young_children",
        "older_adults",
        "pregnancy",
        "lung_condition",
        "heart_condition",
        "young_children",
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-boolean answers and missing fields", () => {
    expect(
      ProfileSchema.safeParse({ ...VALID_PROFILE, hasPurifier: "yes" }).success,
    ).toBe(false);
    expect(
      ProfileSchema.safeParse({ ...VALID_PROFILE, budget: "unlimited" })
        .success,
    ).toBe(false);
  });
});
