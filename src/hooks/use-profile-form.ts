import { useEffect, useRef, useState, type RefObject } from "react";
import type { Language, ReadingMode } from "@/lib/llm/prompts";
import {
  INITIAL_PROFILE_VALUES,
  toProfileCandidate,
  toProfileFieldErrors,
  type ProfileFieldError,
  type ProfileFormValues,
} from "@/lib/profile/form";
import { ProfileSchema, type Profile } from "@/lib/profile/schema";

/**
 * A validated profile and the choices needed to write its plan.
 */
export interface ProfileSubmission {
  profile: Profile;
  language: Language;
  readingMode: ReadingMode;
}

/**
 * State and actions exposed by the profile form hook.
 */
export interface ProfileFormController {
  values: ProfileFormValues;
  errors: ProfileFieldError[];
  summaryRef: RefObject<HTMLDivElement | null>;
  update: <K extends keyof ProfileFormValues>(
    field: K,
    value: ProfileFormValues[K],
  ) => void;
  submit: () => void;
}

/**
 * Holds profile form values and validates them with ProfileSchema on submit.
 */
export function useProfileForm(
  onValid: (submission: ProfileSubmission) => void,
): ProfileFormController {
  const [values, setValues] = useState(INITIAL_PROFILE_VALUES);
  const [errors, setErrors] = useState<ProfileFieldError[]>([]);
  const summaryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (errors.length > 0) {
      summaryRef.current?.focus();
    }
  }, [errors]);

  function update<K extends keyof ProfileFormValues>(
    field: K,
    value: ProfileFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function submit() {
    const parsed = ProfileSchema.safeParse(toProfileCandidate(values));
    if (!parsed.success) {
      setErrors(toProfileFieldErrors(parsed.error));
      return;
    }
    setErrors([]);
    onValid({
      profile: parsed.data,
      language: values.language,
      readingMode: values.readingMode,
    });
  }

  return { values, errors, summaryRef, update, submit };
}
