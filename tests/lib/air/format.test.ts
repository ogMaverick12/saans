import { describe, expect, it } from "vitest";
import {
  formatAirWindow,
  formatHour,
  formatPm25,
  trendText,
} from "@/lib/air/format";

describe("air formatting", () => {
  it("formats midnight, noon and evening hours", () => {
    expect(formatHour(0)).toBe("12 am");
    expect(formatHour(12)).toBe("12 pm");
    expect(formatHour(13)).toBe("1 pm");
    expect(formatHour(24)).toBe("12 am");
  });

  it("formats a three-hour window", () => {
    expect(
      formatAirWindow({ startHour: 14, endHour: 17, meanPm25: 20 }),
    ).toBe("2 pm to 5 pm");
  });

  it("turns trends and PM2.5 values into display text", () => {
    expect(trendText("improving")).toBe("Improving");
    expect(trendText("steady")).toBe("Steady");
    expect(trendText("worsening")).toBe("Worsening");
    expect(formatPm25(42.25)).toBe("42.3 µg/m³");
  });
});
