import { describe, expect, it } from "vitest";
import {
  ClientError,
  isAbortError,
  toClientMessage,
} from "@/lib/client/client-errors";

describe("ClientError", () => {
  it("keeps its code, safe message and error identity", () => {
    const error = new ClientError("RATE_LIMITED", "Wait a moment.");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ClientError");
    expect(error.code).toBe("RATE_LIMITED");
    expect(error.safeMessage).toBe("Wait a moment.");
  });
});

describe("toClientMessage", () => {
  it("returns the safe message only for client errors", () => {
    expect(toClientMessage(new ClientError("NETWORK", "Offline."))).toBe(
      "Offline.",
    );
    expect(toClientMessage(new Error("database password leaked"))).toBe(
      "Something went wrong. Please try again.",
    );
    expect(toClientMessage("unknown")).toBe(
      "Something went wrong. Please try again.",
    );
  });
});

describe("isAbortError re-export", () => {
  it("keeps the browser client's abort helper available", () => {
    expect(isAbortError(new DOMException("Aborted", "AbortError"))).toBe(true);
  });
});
