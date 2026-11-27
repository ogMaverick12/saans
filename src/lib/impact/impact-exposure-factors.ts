import type {
  FactorId,
  ImpactFactor,
  ImpactGroup,
  ImpactScope,
} from "@/lib/impact/impact-types";

function exposureFactor(
  id: FactorId,
  group: ImpactGroup,
  appliesTo: ImpactScope,
  label: string,
  [lowPct, typicalPct, highPct]: readonly [number, number, number],
  source: string,
): ImpactFactor {
  return {
    id,
    label,
    group,
    appliesTo,
    effect: { kind: "exposure_reduction", lowPct, typicalPct, highPct },
    source,
    confidence: "approximate",
  };
}

function computedFactor(
  id: FactorId,
  group: ImpactGroup,
  appliesTo: ImpactScope,
  label: string,
  source: string,
): ImpactFactor {
  return {
    id,
    label,
    group,
    appliesTo,
    effect: { kind: "computed" },
    source,
    confidence: "approximate",
  };
}

/**
 * Mask, cleaner, ventilation, cooking and timing factors.
 */
export const EXPOSURE_FACTORS: readonly ImpactFactor[] = [
  exposureFactor(
    "n95-mask",
    "mask",
    "outdoor",
    "Wear a well-fitted N95 or FFP2 mask",
    [50, 80, 95],
    "N95 or FFP2 filters at least 95 percent of fine particles when fitted well; leaks at the edge are the limit",
  ),
  exposureFactor(
    "surgical-mask",
    "mask",
    "outdoor",
    "Wear a surgical mask",
    [5, 20, 35],
    "Loose masks leave gaps and give modest protection",
  ),
  exposureFactor(
    "cloth-mask",
    "mask",
    "outdoor",
    "Wear a cloth mask",
    [0, 10, 25],
    "Cloth masks filter fine particles poorly",
  ),
  exposureFactor(
    "hepa-purifier",
    "cleaner",
    "indoor",
    "Run a HEPA air purifier",
    [40, 60, 80],
    "HEPA purifier sized for the room, run with doors and windows closed",
  ),
  exposureFactor(
    "diy-box-fan-filter",
    "cleaner",
    "indoor",
    "Make a box-fan filter",
    [30, 50, 70],
    "Box fan with a MERV 13 filter, the Corsi-Rosenthal design",
  ),
  exposureFactor(
    "seal-windows-at-peak",
    "ventilation",
    "indoor",
    "Keep windows closed at peak pollution",
    [20, 40, 60],
    "Closing windows and gaps while outdoor PM2.5 peaks",
  ),
  exposureFactor(
    "cooking-exhaust",
    "cooking",
    "indoor",
    "Use an exhaust fan while cooking",
    [20, 40, 60],
    "Exhaust fan or chimney venting outdoors while cooking",
  ),
  exposureFactor(
    "clean-cooking-fuel",
    "cooking",
    "indoor",
    "Use clean cooking fuel",
    [40, 60, 90],
    "Switching from biomass to LPG, piped gas or induction",
  ),
  computedFactor(
    "shift-outdoor-activity",
    "timing",
    "outdoor",
    "Move outdoor activity to the cleanest hours",
    "Compares the cleanest forecast window with the daily mean",
  ),
];
