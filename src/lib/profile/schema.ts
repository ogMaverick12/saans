import { z } from "zod";
import { sanitizeFreeText } from "@/lib/security/sanitize";

const MAX_HOUSEHOLD_MEMBERS = 5;

/**
 * Household members whose needs can change the plan.
 */
export const HouseholdMemberSchema = z.enum([
  "young_children",
  "older_adults",
  "pregnancy",
  "lung_condition",
  "heart_condition",
]);

/**
 * How the household usually travels.
 */
export const CommuteSchema = z.enum([
  "walk",
  "cycle",
  "two_wheeler",
  "car",
  "bus",
  "metro",
  "work_from_home",
]);

/**
 * The home type, which affects ventilation options.
 */
export const HomeTypeSchema = z.enum([
  "apartment",
  "independent_house",
  "shared_room",
]);

/**
 * The main cooking fuel used at home.
 */
export const CookingFuelSchema = z.enum([
  "lpg",
  "piped_gas",
  "induction",
  "biomass",
  "other",
]);

/**
 * The home's main heating source.
 */
export const HeatingSchema = z.enum([
  "none",
  "electric",
  "gas",
  "wood_or_coal",
]);

/**
 * The household's budget for extra measures.
 */
export const BudgetSchema = z.enum(["low", "medium", "high"]);

/**
 * One household member type.
 */
export type HouseholdMember = z.infer<typeof HouseholdMemberSchema>;

/**
 * One commute mode.
 */
export type Commute = z.infer<typeof CommuteSchema>;

/**
 * One home type.
 */
export type HomeType = z.infer<typeof HomeTypeSchema>;

/**
 * One cooking fuel.
 */
export type CookingFuel = z.infer<typeof CookingFuelSchema>;

/**
 * One heating source.
 */
export type Heating = z.infer<typeof HeatingSchema>;

/**
 * One budget level.
 */
export type Budget = z.infer<typeof BudgetSchema>;

/**
 * Rejects repeated household members.
 */
function isUniqueHousehold(members: HouseholdMember[]): boolean {
  return new Set(members).size === members.length;
}

/**
 * Validated answers from the household profile form.
 */
export const ProfileSchema = z.object({
  household: z
    .array(HouseholdMemberSchema)
    .max(MAX_HOUSEHOLD_MEMBERS)
    .refine(isUniqueHousehold, "Choose each household member only once.")
    .default([]),
  commute: CommuteSchema,
  homeType: HomeTypeSchema,
  hasPurifier: z.boolean(),
  hasAirConditioner: z.boolean(),
  cookingFuel: CookingFuelSchema,
  heating: HeatingSchema,
  budget: BudgetSchema,
  note: z.string().transform(sanitizeFreeText).optional(),
});

/**
 * Validated household profile.
 */
export type Profile = z.infer<typeof ProfileSchema>;
