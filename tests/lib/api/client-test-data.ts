import type { ClientPlanWithImpact } from "@/lib/api/client-plan-schemas";
import { IMPACT_FACTORS } from "@/lib/impact/impact-factors";
import type { ImpactFactor } from "@/lib/impact/impact-types";

/**
 * Returns one catalog factor or fails when the catalog is incomplete.
 */
function requireFactor(id: string): ImpactFactor {
  const factor = IMPACT_FACTORS.find((item) => item.id === id);
  if (factor === undefined) {
    throw new Error(`Expected the impact catalog to contain ${id}`);
  }
  return factor;
}

/**
 * Builds a complete plan with attached impact factors for client tests.
 */
export function buildClientPlan(): ClientPlanWithImpact {
  return {
    airSummary: {
      headline: "A hazy day, so keep the morning quiet",
      explanation:
        "PM2.5 is elevated today. Keep outdoor time short and close windows at peak hours.",
      sensitiveGroupNote:
        "Children and older adults should stay indoors where possible.",
    },
    dailyRoutine: [
      {
        timeBlock: "morning",
        title: "Wear a fitted mask on the commute",
        actions: ["Use an N95 mask", "Check the seal around your nose"],
        factorIds: [requireFactor("n95-mask")],
      },
    ],
    indoorHacks: [
      {
        title: "Run the purifier in the room you use most",
        howTo: "Close the doors and windows and run it on a medium setting.",
        cost: "free",
        effort: "easy",
        factorIds: [requireFactor("hepa-purifier")],
      },
    ],
    sustainableAlternatives: [
      {
        area: "commute",
        swap: "Take the metro or bus",
        whyItHelps: "Shared transport emits less per passenger.",
        communityBenefit: "Reliable public transport cuts traffic and smoke.",
        factorIds: [requireFactor("metro-or-bus")],
      },
    ],
    communityActions: [
      {
        title: "Share the daily air reading",
        description: "Tell neighbours when the cleanest outdoor window is.",
      },
    ],
    doctorNote: null,
  };
}
