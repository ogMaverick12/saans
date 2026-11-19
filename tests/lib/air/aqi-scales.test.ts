import { describe, expect, it } from "vitest";
import { cpcbPm25Category, usAqiCategory } from "@/lib/air/aqi-scales";

const US_AQI_CASES = [
  { value: 0, label: "Good", level: 0 },
  { value: 50, label: "Good", level: 0 },
  { value: 51, label: "Moderate", level: 1 },
  { value: 100, label: "Moderate", level: 1 },
  { value: 101, label: "Unhealthy for Sensitive Groups", level: 2 },
  { value: 150, label: "Unhealthy for Sensitive Groups", level: 2 },
  { value: 151, label: "Unhealthy", level: 3 },
  { value: 200, label: "Unhealthy", level: 3 },
  { value: 201, label: "Very Unhealthy", level: 4 },
  { value: 300, label: "Very Unhealthy", level: 4 },
  { value: 301, label: "Hazardous", level: 5 },
] as const;

const CPCB_PM25_CASES = [
  { value: 0, label: "Good", level: 0 },
  { value: 30, label: "Good", level: 0 },
  { value: 31, label: "Satisfactory", level: 1 },
  { value: 60, label: "Satisfactory", level: 1 },
  { value: 61, label: "Moderate", level: 2 },
  { value: 90, label: "Moderate", level: 2 },
  { value: 91, label: "Poor", level: 3 },
  { value: 120, label: "Poor", level: 3 },
  { value: 121, label: "Very Poor", level: 4 },
  { value: 250, label: "Very Poor", level: 4 },
  { value: 251, label: "Severe", level: 5 },
] as const;

describe("usAqiCategory", () => {
  it.each(US_AQI_CASES)(
    "maps $value to $label at level $level",
    ({ value, label, level }) => {
      expect(usAqiCategory(value)).toEqual({ label, level });
    },
  );
});

describe("cpcbPm25Category", () => {
  it.each(CPCB_PM25_CASES)(
    "maps $value to $label at level $level",
    ({ value, label, level }) => {
      expect(cpcbPm25Category(value)).toEqual({ label, level });
    },
  );
});
