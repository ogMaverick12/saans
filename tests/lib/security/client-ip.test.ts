import { describe, expect, it } from "vitest";
import { getClientIp } from "@/lib/security/client-ip";

describe("getClientIp", () => {
  it("returns the first address in the forwarding chain", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178",
    });

    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  it("trims whitespace around the first address", () => {
    const headers = new Headers({ "x-forwarded-for": "  203.0.113.7  " });

    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  it("returns unknown when the header is missing or its first entry is empty", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
    expect(
      getClientIp(new Headers({ "x-forwarded-for": " , 203.0.113.7" })),
    ).toBe("unknown");
  });
});
