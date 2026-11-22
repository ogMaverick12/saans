import type { Plan } from "@/lib/llm/plan-schema";
import type { Language } from "@/lib/llm/prompts";

/**
 * One time-of-day block in the daily routine.
 */
export type TimeBlock = Plan["dailyRoutine"][number]["timeBlock"];

/**
 * One cost level for an indoor hack.
 */
export type Cost = Plan["indoorHacks"][number]["cost"];

/**
 * One effort level for an indoor hack.
 */
export type Effort = Plan["indoorHacks"][number]["effort"];

/**
 * One area a sustainable alternative belongs to.
 */
export type Area = Plan["sustainableAlternatives"][number]["area"];

/**
 * Time blocks from earliest to latest.
 */
export const TIME_BLOCK_ORDER: readonly TimeBlock[] = [
  "early_morning",
  "morning",
  "midday",
  "afternoon",
  "evening",
  "night",
];

/**
 * Readable labels for each time block.
 */
export const TIME_BLOCK_LABELS: Readonly<Record<TimeBlock, string>> = {
  early_morning: "Early morning",
  morning: "Morning",
  midday: "Midday",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

/**
 * Readable labels for each indoor-hack cost.
 */
export const COST_LABELS: Readonly<Record<Cost, string>> = {
  free: "Free",
  low: "Low cost",
  medium: "Medium cost",
  high: "High cost",
};

/**
 * Readable labels for each indoor-hack effort.
 */
export const EFFORT_LABELS: Readonly<Record<Effort, string>> = {
  easy: "Easy",
  moderate: "Moderate",
  involved: "Involved",
};

/**
 * Readable labels for each alternative area.
 */
export const AREA_LABELS: Readonly<Record<Area, string>> = {
  commute: "Commute",
  cooking: "Cooking",
  heating: "Heating",
  waste: "Waste",
  energy: "Energy",
};

/**
 * Speech-synthesis language tags for each plan language.
 */
export const READ_ALOUD_LANGUAGES: Readonly<Record<Language, string>> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
};

/**
 * The plan parts the read-aloud button speaks.
 */
export interface ReadAloudPlan {
  airSummary: { headline: string };
  dailyRoutine: readonly {
    timeBlock: TimeBlock;
    title: string;
    actions: readonly string[];
  }[];
  indoorHacks: readonly { title: string; howTo: string }[];
}

/**
 * Returns a copy of routine items sorted from earliest to latest.
 */
export function sortByTimeBlock<T extends { timeBlock: TimeBlock }>(
  items: readonly T[],
): T[] {
  return [...items].sort(
    (left, right) =>
      TIME_BLOCK_ORDER.indexOf(left.timeBlock) -
      TIME_BLOCK_ORDER.indexOf(right.timeBlock),
  );
}

/**
 * Builds the spoken text for the headline, time-ordered routine and indoor hacks.
 */
export function buildReadAloudText(plan: ReadAloudPlan): string {
  const routine = sortByTimeBlock(plan.dailyRoutine).map(
    (item) =>
      `${TIME_BLOCK_LABELS[item.timeBlock]}. ${item.title}. ${item.actions.join(". ")}.`,
  );
  const hacks = plan.indoorHacks.map(
    (hack) => `${hack.title}. ${hack.howTo}.`,
  );
  return [plan.airSummary.headline, ...routine, ...hacks].join(" ");
}
