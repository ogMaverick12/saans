import type { AirTrend, AirWindow } from "@/lib/air/digest-schema";

const HOURS_PER_DAY = 24;
const HOURS_PER_HALF_DAY = 12;

/**
 * The unit used when showing fine particulate matter.
 */
export const PM25_UNIT = "µg/m³";

/**
 * Formats a 24-hour clock hour as a short local time, such as "2 pm".
 */
export function formatHour(hour: number): string {
  const normalized = ((hour % HOURS_PER_DAY) + HOURS_PER_DAY) % HOURS_PER_DAY;
  const hourOnClock = normalized % HOURS_PER_HALF_DAY;
  const displayHour = hourOnClock === 0 ? HOURS_PER_HALF_DAY : hourOnClock;
  const period = normalized < HOURS_PER_HALF_DAY ? "am" : "pm";
  return `${displayHour} ${period}`;
}

/**
 * Formats a three-hour window as "2 pm to 5 pm".
 */
export function formatAirWindow(window: AirWindow): string {
  return `${formatHour(window.startHour)} to ${formatHour(window.endHour)}`;
}

/**
 * Turns a PM2.5 trend value into a word.
 */
export function trendText(trend: AirTrend): string {
  if (trend === "improving") {
    return "Improving";
  }
  if (trend === "worsening") {
    return "Worsening";
  }
  return "Steady";
}

/**
 * Formats a PM2.5 value with one decimal place and its unit.
 */
export function formatPm25(value: number): string {
  return `${value.toFixed(1)} ${PM25_UNIT}`;
}
