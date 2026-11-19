import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";

describe("AppError", () => {
  it("carries a stable code and a user-safe message", () => {
    const message = "The air data service did not respond in time.";
    const error = new AppError("UPSTREAM_TIMEOUT", message);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AppError");
    expect(error.code).toBe("UPSTREAM_TIMEOUT");
    expect(error.safeMessage).toBe(message);
    expect(error.message).toBe(message);
  });

  it("keeps distinct codes for distinct failures", () => {
    const limited = new AppError("RATE_LIMITED", "Too many requests.");
    const invalidOutput = new AppError(
      "LLM_BAD_OUTPUT",
      "The assistant returned an invalid answer.",
    );

    expect(limited.code).not.toBe(invalidOutput.code);
    expect(limited.safeMessage).not.toBe(invalidOutput.safeMessage);
  });

  it("survives a standard catch block with its code intact", () => {
    expect.assertions(2);

    try {
      throw new AppError("INTERNAL", "Something went wrong.");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      if (error instanceof AppError) {
        expect(error.code).toBe("INTERNAL");
      }
    }
  });
});
