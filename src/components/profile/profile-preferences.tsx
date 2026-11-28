import { FieldsetGroup } from "@/components/profile/fieldset-group";
import { NoteField } from "@/components/profile/note-field";
import { SwitchField } from "@/components/profile/switch-field";
import type { ProfileFormValues } from "@/lib/profile/form";
import { BUDGET_OPTIONS, LANGUAGE_OPTIONS } from "@/lib/profile/form";

export interface ProfilePreferencesProps {
  values: ProfileFormValues;
  errorFor: (field: string) => string | undefined;
  update: <K extends keyof ProfileFormValues>(
    field: K,
    value: ProfileFormValues[K],
  ) => void;
}

/**
 * Renders the budget, plan language, reading mode and optional note answers.
 */
export function ProfilePreferences({
  values,
  errorFor,
  update,
}: ProfilePreferencesProps) {
  return (
    <>
      <FieldsetGroup
        type="radio"
        id="profile-budget"
        name="budget"
        legend="Budget for extra measures"
        value={values.budget}
        options={BUDGET_OPTIONS}
        onChange={(budget) => update("budget", budget)}
        error={errorFor("budget")}
      />

      <FieldsetGroup
        type="radio"
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
    </>
  );
}
