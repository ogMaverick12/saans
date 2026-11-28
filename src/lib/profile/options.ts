import type { Language } from "@/lib/llm/prompts";
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

export const HOUSEHOLD_OPTIONS: readonly ProfileOption<HouseholdMember>[] = [
  { value: "young_children", label: "Young children" },
  { value: "older_adults", label: "Older adults" },
  { value: "pregnancy", label: "Pregnancy" },
  { value: "lung_condition", label: "Lung condition" },
  { value: "heart_condition", label: "Heart condition" },
];

export const COMMUTE_OPTIONS: readonly ProfileOption<Commute>[] = [
  { value: "walk", label: "Walking" },
  { value: "cycle", label: "Cycling" },
  { value: "two_wheeler", label: "Two-wheeler" },
  { value: "car", label: "Car" },
  { value: "bus", label: "Bus" },
  { value: "metro", label: "Metro or train" },
  { value: "work_from_home", label: "Work from home" },
];

export const HOME_TYPE_OPTIONS: readonly ProfileOption<HomeType>[] = [
  { value: "apartment", label: "Apartment" },
  { value: "independent_house", label: "Independent house" },
  { value: "shared_room", label: "Shared room" },
];

export const COOKING_FUEL_OPTIONS: readonly ProfileOption<CookingFuel>[] = [
  { value: "lpg", label: "LPG cylinder" },
  { value: "piped_gas", label: "Piped gas" },
  { value: "induction", label: "Electric induction" },
  { value: "biomass", label: "Biomass or wood" },
  { value: "other", label: "Other" },
];

export const HEATING_OPTIONS: readonly ProfileOption<Heating>[] = [
  { value: "none", label: "None" },
  { value: "electric", label: "Electric heater" },
  { value: "gas", label: "Gas heater" },
  { value: "wood_or_coal", label: "Wood or coal" },
];

export const BUDGET_OPTIONS: readonly ProfileOption<Budget>[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const LANGUAGE_OPTIONS: readonly ProfileOption<Language>[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "bn", label: "বাংলা" },
];
