import { describe, expect, it } from "vitest";
import { getClientIp } from "@/lib/security/client-ip";

describe("getClientIp", () => {
  it("prefers the platform-set real IP header", () => {
    const headers = new Headers({
      "x-real-ip": "198.51.100.9",
      "x-forwarded-for": "203.0.113.7, 70.41.3.18",
    });

    expect(getClientIp(headers)).toBe("198.51.100.9");
  });

  it("uses the nearest address in the forwarding chain", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178",
    });

    expect(getClientIp(headers)).toBe("150.172.238.178");
  });

  it("trims whitespace around the nearest address", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.7,  198.51.100.4  ",
    });

    expect(getClientIp(headers)).toBe("198.51.100.4");
  });

  it("returns unknown when the headers are missing or blank", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
    expect(getClientIp(new Headers({ "x-real-ip": "   " }))).toBe("unknown");
    expect(
      getClientIp(new Headers({ "x-forwarded-for": "203.0.113.7, " })),
    ).toBe("unknown");
  });
});
