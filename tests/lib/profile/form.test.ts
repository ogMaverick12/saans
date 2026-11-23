import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  INITIAL_PROFILE_VALUES,
  toProfileCandidate,
  toProfileFieldErrors,
} from "@/lib/profile/form";
import { ProfileSchema } from "@/lib/profile/schema";

describe("profile form helpers", () => {
  it("omits a blank note and keeps a real one", () => {
    const blank = toProfileCandidate({
      ...INITIAL_PROFILE_VALUES,
      note: "   ",
    });
    const filled = toProfileCandidate({
      ...INITIAL_PROFILE_VALUES,
      note: "Keep the bedroom door closed.",
    });

    expect(blank).not.toHaveProperty("note");
    expect(filled).toHaveProperty("note", "Keep the bedroom door closed.");
  });

  it("maps schema issues to linked field errors", () => {
    const parsed = ProfileSchema.safeParse(
      toProfileCandidate(INITIAL_PROFILE_VALUES),
    );
    if (parsed.success) {
      throw new Error("Expected the empty profile to fail validation");
    }

    const errors = toProfileFieldErrors(parsed.error);

    expect(errors).toContainEqual({
      field: "commute",
      fieldId: "profile-commute",
      message: "Choose how your household usually travels.",
    });
    expect(errors).toContainEqual({
      field: "homeType",
      fieldId: "profile-homeType",
      message: "Choose your home type.",
    });
  });

  it("falls back to the form anchor for an unknown field", () => {
    const error = new ZodError([
      { code: "custom", path: ["mystery"], message: "Unknown field." },
    ]);

    expect(toProfileFieldErrors(error)).toEqual([
      {
        field: "mystery",
        fieldId: "profile-form",
        message: "Check this answer.",
      },
    ]);
  });

  it("deduplicates issues that share a field", () => {
    const error = new ZodError([
      { code: "custom", path: ["note"], message: "First." },
      { code: "custom", path: ["note"], message: "Second." },
    ]);

    expect(toProfileFieldErrors(error)).toHaveLength(1);
  });

  it("keeps only one error per field", () => {
    const parsed = ProfileSchema.safeParse(
      toProfileCandidate({ ...INITIAL_PROFILE_VALUES, commute: "" }),
    );
    if (parsed.success) {
      throw new Error("Expected an invalid commute");
    }

    const errors = toProfileFieldErrors(parsed.error);
    const commuteErrors = errors.filter((error) => error.field === "commute");

    expect(commuteErrors).toHaveLength(1);
  });
});
