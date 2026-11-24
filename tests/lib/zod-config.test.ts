import { describe, expect, it } from "vitest";
import { z } from "zod";
import "@/lib/zod-config";

const PositiveCountSchema = z.object({
  count: z.number().refine((value) => value > 0, "Must be positive."),
});

describe("zod-config", () => {
  it("disables Zod's eval-based JIT for the strict CSP", () => {
    expect(z.core.globalConfig.jitless).toBe(true);
  });

  it("keeps refined schemas parsing valid input", () => {
    expect(PositiveCountSchema.parse({ count: 2 })).toEqual({ count: 2 });
  });

  it("keeps reporting issues for invalid input", () => {
    const result = PositiveCountSchema.safeParse({ count: 0 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Must be positive.");
    }
  });
});
