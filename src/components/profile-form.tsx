"use client";

import type { FormEvent } from "react";
import { CheckboxFieldset } from "@/components/profile/checkbox-fieldset";
import { ErrorSummary } from "@/components/profile/error-summary";
import { HomeFieldset } from "@/components/profile/home-fieldset";
import { NoteField } from "@/components/profile/note-field";
import { ProfileSubmit } from "@/components/profile/profile-submit";
import { RadioFieldset } from "@/components/profile/radio-fieldset";
import { SwitchField } from "@/components/profile/switch-field";
import {
  useProfileForm,
  type ProfileSubmission,
} from "@/hooks/use-profile-form";
import {
  BUDGET_OPTIONS,
  COMMUTE_OPTIONS,
  COOKING_FUEL_OPTIONS,
  HEATING_OPTIONS,
  HOUSEHOLD_OPTIONS,
  LANGUAGE_OPTIONS,
} from "@/lib/profile/form";

/**
 * Props for the household profile form.
 */
export interface ProfileFormProps {
  onSubmit: (submission: ProfileSubmission) => void;
  isSubmitting: boolean;
}

/**
 * Collects and validates the household profile before writing a plan.
 */
export function ProfileForm({ onSubmit, isSubmitting }: ProfileFormProps) {
  const { values, errors, summaryRef, update, submit } =
    useProfileForm(onSubmit);

  function errorFor(field: string): string | undefined {
    return errors.find((error) => error.field === field)?.message;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  return (
    <form
      id="profile-form"
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isSubmitting}
      className="space-y-8"
    >
      <ErrorSummary errors={errors} summaryRef={summaryRef} />

      <CheckboxFieldset
        id="profile-household"
        legend="Who lives in your household?"
        hint="Select any that apply."
        selected={values.household}
        options={HOUSEHOLD_OPTIONS}
        onChange={(household) => update("household", household)}
        error={errorFor("household")}
      />

      <RadioFieldset
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
        onPurifierChange={(hasPurifier) =>
          update("hasPurifier", hasPurifier)
        }
        onAirConditionerChange={(hasAirConditioner) =>
          update("hasAirConditioner", hasAirConditioner)
        }
        error={errorFor("homeType")}
      />

      <RadioFieldset
        id="profile-cookingFuel"
        name="cookingFuel"
        legend="Main cooking fuel"
        value={values.cookingFuel}
        options={COOKING_FUEL_OPTIONS}
        onChange={(cookingFuel) => update("cookingFuel", cookingFuel)}
        error={errorFor("cookingFuel")}
      />

      <RadioFieldset
        id="profile-heating"
        name="heating"
        legend="Main heating source"
        value={values.heating}
        options={HEATING_OPTIONS}
        onChange={(heating) => update("heating", heating)}
        error={errorFor("heating")}
      />

      <RadioFieldset
        id="profile-budget"
        name="budget"
        legend="Budget for extra measures"
        value={values.budget}
        options={BUDGET_OPTIONS}
        onChange={(budget) => update("budget", budget)}
        error={errorFor("budget")}
      />

      <RadioFieldset
        id="profile-language"
        name="language"
        legend="Plan language"
        value={values.language}
        options={LANGUAGE_OPTIONS}
        onChange={(language) => update("language", language)}
      />

      <SwitchField
        id="profile-reading-mode"
        label="Simple reading mode"
        description="Use shorter sentences and everyday words."
        checked={values.readingMode === "simple"}
        onChange={(checked) =>
          update("readingMode", checked ? "simple" : "standard")
        }
      />

      <NoteField
        value={values.note}
        onChange={(note) => update("note", note)}
        error={errorFor("note")}
      />

      <ProfileSubmit isSubmitting={isSubmitting} />
    </form>
  );
}
