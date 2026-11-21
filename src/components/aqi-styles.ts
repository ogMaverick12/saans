import type { AqiLevel } from "@/lib/air/aqi-scales";

/**
 * Background and text colours for each AQI badge level, checked for WCAG AA.
 */
export const AQI_BADGE_CLASSES: Readonly<Record<AqiLevel, string>> = {
  0: "bg-[#dcfce7] text-[#14532d]",
  1: "bg-[#fef9c3] text-[#713f12]",
  2: "bg-[#ffedd5] text-[#7c2d12]",
  3: "bg-[#fee2e2] text-[#7f1d1d]",
  4: "bg-[#f3e8ff] text-[#581c87]",
  5: "bg-[#ffe4e6] text-[#881337]",
};

/**
 * Left border colours for the air card at each AQI level.
 */
export const AQI_BORDER_CLASSES: Readonly<Record<AqiLevel, string>> = {
  0: "border-l-[#16a34a]",
  1: "border-l-[#ca8a04]",
  2: "border-l-[#ea580c]",
  3: "border-l-[#dc2626]",
  4: "border-l-[#9333ea]",
  5: "border-l-[#be123c]",
};
