import { describe, expect, it } from "vitest";
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
