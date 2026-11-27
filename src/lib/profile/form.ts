import type { ZodError } from "zod";
import { FREE_TEXT_MAX_CHARS } from "@/lib/config";
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
 * Selectable profile options and their display labels.
 */
export {
  BUDGET_OPTIONS,
  COMMUTE_OPTIONS,
  COOKING_FUEL_OPTIONS,
  HEATING_OPTIONS,
  HOME_TYPE_OPTIONS,
  HOUSEHOLD_OPTIONS,
  LANGUAGE_OPTIONS,
} from "@/lib/profile/options";
/** One selectable profile option with its value and label. */
export type { ProfileOption } from "@/lib/profile/options";

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
  note: `Keep your note within ${FREE_TEXT_MAX_CHARS} characters.`,
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
export function toProfileFieldErrors(error: ZodError): ProfileFieldError[] {
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
