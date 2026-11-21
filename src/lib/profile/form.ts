import type { ZodError } from "zod";
import type { Language, ReadingMode } from "@/lib/llm/prompts";
import type {
  Budget,
  Commute,
  CookingFuel,
  Heating,
  HomeType,
  HouseholdMember,
} from "@/lib/profile/schema";

/**
 * One labelled choice in the profile form.
 */
export interface ProfileOption<T extends string> {
  value: T;
  label: string;
}

/**
 * The raw values held by the profile form before validation.
 */
export interface ProfileFormValues {
  household: HouseholdMember[];
  commute: Commute | "";
  homeType: HomeType | "";
  hasPurifier: boolean;
  hasAirConditioner: boolean;
  cookingFuel: CookingFuel | "";
  heating: Heating | "";
  budget: Budget | "";
  language: Language;
  readingMode: ReadingMode;
  note: string;
}

/**
 * One validation problem tied to a field and its anchor.
 */
export interface ProfileFieldError {
  field: string;
  fieldId: string;
  message: string;
}

/**
 * The untouched profile form.
 */
export const INITIAL_PROFILE_VALUES: ProfileFormValues = {
  household: [],
  commute: "",
  homeType: "",
  hasPurifier: false,
  hasAirConditioner: false,
  cookingFuel: "",
  heating: "",
  budget: "",
  language: "en",
  readingMode: "standard",
  note: "",
};

/**
 * Household members offered as checkboxes.
 */
export const HOUSEHOLD_OPTIONS: readonly ProfileOption<HouseholdMember>[] = [
  { value: "young_children", label: "Young children" },
  { value: "older_adults", label: "Older adults" },
  { value: "pregnancy", label: "Pregnancy" },
  { value: "lung_condition", label: "Lung condition" },
  { value: "heart_condition", label: "Heart condition" },
];

/**
 * Everyday travel choices.
 */
export const COMMUTE_OPTIONS: readonly ProfileOption<Commute>[] = [
  { value: "walk", label: "Walking" },
  { value: "cycle", label: "Cycling" },
  { value: "two_wheeler", label: "Two-wheeler" },
  { value: "car", label: "Car" },
  { value: "bus", label: "Bus" },
  { value: "metro", label: "Metro or train" },
  { value: "work_from_home", label: "Work from home" },
];

/**
 * Home type choices.
 */
export const HOME_TYPE_OPTIONS: readonly ProfileOption<HomeType>[] = [
  { value: "apartment", label: "Apartment" },
  { value: "independent_house", label: "Independent house" },
  { value: "shared_room", label: "Shared room" },
];

/**
 * Cooking fuel choices.
 */
export const COOKING_FUEL_OPTIONS: readonly ProfileOption<CookingFuel>[] = [
  { value: "lpg", label: "LPG cylinder" },
  { value: "piped_gas", label: "Piped gas" },
  { value: "induction", label: "Electric induction" },
  { value: "biomass", label: "Biomass or wood" },
  { value: "other", label: "Other" },
];

/**
 * Heating source choices.
 */
export const HEATING_OPTIONS: readonly ProfileOption<Heating>[] = [
  { value: "none", label: "None" },
  { value: "electric", label: "Electric heater" },
  { value: "gas", label: "Gas heater" },
  { value: "wood_or_coal", label: "Wood or coal" },
];

/**
 * Budget choices.
 */
export const BUDGET_OPTIONS: readonly ProfileOption<Budget>[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

/**
 * Plan language choices.
 */
export const LANGUAGE_OPTIONS: readonly ProfileOption<Language>[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "bn", label: "বাংলা" },
];

const PROFILE_FIELD_IDS: Readonly<Record<string, string>> = {
  household: "profile-household",
  commute: "profile-commute",
  homeType: "profile-homeType",
  cookingFuel: "profile-cookingFuel",
  heating: "profile-heating",
  budget: "profile-budget",
  note: "profile-note",
};

const PROFILE_FIELD_MESSAGES: Readonly<Record<string, string>> = {
  household: "Check the household members you selected.",
  commute: "Choose how your household usually travels.",
  homeType: "Choose your home type.",
  cookingFuel: "Choose your main cooking fuel.",
  heating: "Choose your main heating source.",
  budget: "Choose a budget for extra measures.",
  note: "Keep your note within 200 characters.",
};

/**
 * Converts form values into the object validated by ProfileSchema.
 */
export function toProfileCandidate(values: ProfileFormValues): unknown {
  const note = values.note.trim();
  return {
    household: values.household,
    commute: values.commute,
    homeType: values.homeType,
    hasPurifier: values.hasPurifier,
    hasAirConditioner: values.hasAirConditioner,
    cookingFuel: values.cookingFuel,
    heating: values.heating,
    budget: values.budget,
    ...(note === "" ? {} : { note }),
  };
}

/**
 * Turns Zod issues into one friendly, linked error per field.
 */
export function toProfileFieldErrors(
  error: ZodError,
): ProfileFieldError[] {
  const seen = new Set<string>();
  const errors: ProfileFieldError[] = [];
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (seen.has(field)) {
      continue;
    }
    seen.add(field);
    errors.push({
      field,
      fieldId: PROFILE_FIELD_IDS[field] ?? "profile-form",
      message: PROFILE_FIELD_MESSAGES[field] ?? "Check this answer.",
    });
  }
  return errors;
}
