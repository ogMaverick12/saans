import { FieldsetGroup } from "@/components/profile/fieldset-group";
import { HomeFieldset } from "@/components/profile/home-fieldset";
import type { ProfileFormValues } from "@/lib/profile/form";
import {
  COMMUTE_OPTIONS,
  COOKING_FUEL_OPTIONS,
  HEATING_OPTIONS,
  HOUSEHOLD_OPTIONS,
} from "@/lib/profile/form";

/**
 * Props for the household, travel and home fields.
 */
export interface ProfileHouseholdFieldsProps {
  values: ProfileFormValues;
  errorFor: (field: string) => string | undefined;
  update: <K extends keyof ProfileFormValues>(
    field: K,
    value: ProfileFormValues[K],
  ) => void;
}

/**
 * Renders the household, commute, home, cooking and heating answers.
 */
export function ProfileHouseholdFields({
  values,
  errorFor,
  update,
}: ProfileHouseholdFieldsProps) {
  return (
    <>
      <FieldsetGroup
        type="checkbox"
        id="profile-household"
        legend="Who lives in your household?"
        hint="Select any that apply."
        selected={values.household}
        options={HOUSEHOLD_OPTIONS}
        onChange={(household) => update("household", household)}
        error={errorFor("household")}
      />

      <FieldsetGroup
        type="radio"
        id="profile-commute"
        name="commute"
        legend="How does your household usually travel?"
        value={values.commute}
        options={COMMUTE_OPTIONS}
        onChange={(commute) => update("commute", commute)}
        error={errorFor("commute")}
      />

      <HomeFieldset
        homeType={values.homeType}
        hasPurifier={values.hasPurifier}
        hasAirConditioner={values.hasAirConditioner}
        onHomeTypeChange={(homeType) => update("homeType", homeType)}
        onPurifierChange={(hasPurifier) => update("hasPurifier", hasPurifier)}
        onAirConditionerChange={(hasAirConditioner) =>
          update("hasAirConditioner", hasAirConditioner)
        }
        error={errorFor("homeType")}
      />

      <FieldsetGroup
        type="radio"
        id="profile-cookingFuel"
        name="cookingFuel"
        legend="Main cooking fuel"
        value={values.cookingFuel}
        options={COOKING_FUEL_OPTIONS}
        onChange={(cookingFuel) => update("cookingFuel", cookingFuel)}
        error={errorFor("cookingFuel")}
      />

      <FieldsetGroup
        type="radio"
        id="profile-heating"
        name="heating"
        legend="Main heating source"
        value={values.heating}
        options={HEATING_OPTIONS}
        onChange={(heating) => update("heating", heating)}
        error={errorFor("heating")}
      />
    </>
  );
}
