"use client";

import type { FormEvent } from "react";
import { ErrorSummary } from "@/components/profile/error-summary";
import { ProfileHouseholdFields } from "@/components/profile/profile-household-fields";
import { ProfilePreferences } from "@/components/profile/profile-preferences";
import { ProfileSubmit } from "@/components/profile/profile-submit";
import {
  useProfileForm,
  type ProfileSubmission,
} from "@/hooks/use-profile-form";

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
      <ProfileHouseholdFields
        values={values}
        errorFor={errorFor}
        update={update}
      />
      <ProfilePreferences values={values} errorFor={errorFor} update={update} />
      <ProfileSubmit isSubmitting={isSubmitting} />
    </form>
  );
}
