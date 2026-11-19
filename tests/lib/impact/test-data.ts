import type { AirDigest } from "@/lib/air/schemas";
import type { Commute, Profile } from "@/lib/profile/schema";

/**
 * Builds a digest with controllable daily and clean-window PM2.5.
 */
export function buildDigest(
  dailyMeanPm25 = 100,
  cleanestMeanPm25 = 40,
): AirDigest {
  return {
    observedAt: "2026-11-19T13:30",
    pm2_5: dailyMeanPm25,
    usAqi: 165,
    usCategory: { label: "Unhealthy", level: 3 },
    cpcbCategory: null,
    dailyMeanPm25,
    trend: "steady",
    cleanestWindow: {
      startHour: 13,
      endHour: 16,
      meanPm25: cleanestMeanPm25,
    },
    worstWindow: { startHour: 21, endHour: 24, meanPm25: 200 },
    weather: { tempC: 23.5, humidityPct: 46, windKmh: 3.8 },
    smogCues: [],
  };
}

/**
 * Builds a complete profile with the given commute mode.
 */
export function buildProfile(commute: Commute = "walk"): Profile {
  return {
    household: [],
    commute,
    homeType: "apartment",
    hasPurifier: true,
    hasAirConditioner: false,
    cookingFuel: "lpg",
    heating: "none",
    budget: "medium",
  };
}
