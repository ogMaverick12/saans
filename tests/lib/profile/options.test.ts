import { describe, expect, it } from "vitest";
import {
  BUDGET_OPTIONS,
  COMMUTE_OPTIONS,
  COOKING_FUEL_OPTIONS,
  HEATING_OPTIONS,
  HOME_TYPE_OPTIONS,
  HOUSEHOLD_OPTIONS,
  LANGUAGE_OPTIONS,
  type ProfileOption,
} from "@/lib/profile/options";
import {
  BudgetSchema,
  CommuteSchema,
  CookingFuelSchema,
  HeatingSchema,
  HomeTypeSchema,
  HouseholdMemberSchema,
} from "@/lib/profile/schema";

const ALL_OPTIONS: readonly (readonly ProfileOption<string>[])[] = [
  HOUSEHOLD_OPTIONS,
  COMMUTE_OPTIONS,
  HOME_TYPE_OPTIONS,
  COOKING_FUEL_OPTIONS,
  HEATING_OPTIONS,
  BUDGET_OPTIONS,
  LANGUAGE_OPTIONS,
];

/**
 * Returns the values offered by one option list.
 */
function optionValues(options: readonly ProfileOption<string>[]): string[] {
  return options.map((option) => option.value);
}

describe("profile options", () => {
  it("offers every schema value exactly once", () => {
    expect(optionValues(HOUSEHOLD_OPTIONS).sort()).toEqual(
      [...HouseholdMemberSchema.options].sort(),
    );
    expect(optionValues(COMMUTE_OPTIONS).sort()).toEqual(
      [...CommuteSchema.options].sort(),
    );
    expect(optionValues(HOME_TYPE_OPTIONS).sort()).toEqual(
      [...HomeTypeSchema.options].sort(),
    );
    expect(optionValues(COOKING_FUEL_OPTIONS).sort()).toEqual(
      [...CookingFuelSchema.options].sort(),
    );
    expect(optionValues(HEATING_OPTIONS).sort()).toEqual(
      [...HeatingSchema.options].sort(),
    );
    expect(optionValues(BUDGET_OPTIONS).sort()).toEqual(
      [...BudgetSchema.options].sort(),
    );
  });

  it("offers all three plan languages", () => {
    expect(optionValues(LANGUAGE_OPTIONS)).toEqual(["en", "hi", "bn"]);
  });

  it("labels every option with non-empty text", () => {
    for (const options of ALL_OPTIONS) {
      for (const option of options) {
        expect(option.label.trim()).not.toBe("");
      }
    }
  });

  it("keeps labels unique within each list", () => {
    for (const options of ALL_OPTIONS) {
      const labels = options.map((option) => option.label);
      expect(new Set(labels).size).toBe(labels.length);
    }
  });
});
