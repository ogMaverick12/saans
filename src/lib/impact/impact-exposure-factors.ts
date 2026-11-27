import type {
  FactorId,
  ImpactFactor,
  ImpactGroup,
  ImpactScope,
} from "@/lib/impact/impact-types";

interface BaseFactorInput {
  id: FactorId;
  group: ImpactGroup;
  appliesTo: ImpactScope;
  label: string;
  source: string;
}

interface ExposureFactorInput extends BaseFactorInput {
  reduction: readonly [number, number, number];
}

function exposureFactor({
  id,
  group,
  appliesTo,
  label,
  reduction: [lowPct, typicalPct, highPct],
  source,
}: ExposureFactorInput): ImpactFactor {
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

function computedFactor({
  id,
  group,
  appliesTo,
  label,
  source,
}: BaseFactorInput): ImpactFactor {
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
  exposureFactor({
    id: "n95-mask",
    group: "mask",
    appliesTo: "outdoor",
    label: "Wear a well-fitted N95 or FFP2 mask",
    reduction: [50, 80, 95],
    source:
      "N95 or FFP2 filters at least 95 percent of fine particles when fitted well; leaks at the edge are the limit",
  }),
  exposureFactor({
    id: "surgical-mask",
    group: "mask",
    appliesTo: "outdoor",
    label: "Wear a surgical mask",
    reduction: [5, 20, 35],
    source: "Loose masks leave gaps and give modest protection",
  }),
  exposureFactor({
    id: "cloth-mask",
    group: "mask",
    appliesTo: "outdoor",
    label: "Wear a cloth mask",
    reduction: [0, 10, 25],
    source: "Cloth masks filter fine particles poorly",
  }),
  exposureFactor({
    id: "hepa-purifier",
    group: "cleaner",
    appliesTo: "indoor",
    label: "Run a HEPA air purifier",
    reduction: [40, 60, 80],
    source:
      "HEPA purifier sized for the room, run with doors and windows closed",
  }),
  exposureFactor({
    id: "diy-box-fan-filter",
    group: "cleaner",
    appliesTo: "indoor",
    label: "Make a box-fan filter",
    reduction: [30, 50, 70],
    source: "Box fan with a MERV 13 filter, the Corsi-Rosenthal design",
  }),
  exposureFactor({
    id: "seal-windows-at-peak",
    group: "ventilation",
    appliesTo: "indoor",
    label: "Keep windows closed at peak pollution",
    reduction: [20, 40, 60],
    source: "Closing windows and gaps while outdoor PM2.5 peaks",
  }),
  exposureFactor({
    id: "cooking-exhaust",
    group: "cooking",
    appliesTo: "indoor",
    label: "Use an exhaust fan while cooking",
    reduction: [20, 40, 60],
    source: "Exhaust fan or chimney venting outdoors while cooking",
  }),
  exposureFactor({
    id: "clean-cooking-fuel",
    group: "cooking",
    appliesTo: "indoor",
    label: "Use clean cooking fuel",
    reduction: [40, 60, 90],
    source: "Switching from biomass to LPG, piped gas or induction",
  }),
  computedFactor({
    id: "shift-outdoor-activity",
    group: "timing",
    appliesTo: "outdoor",
    label: "Move outdoor activity to the cleanest hours",
    source: "Compares the cleanest forecast window with the daily mean",
  }),
];
