import type {
  FactorId,
  ImpactFactor,
  ImpactGroup,
  ImpactScope,
} from "@/lib/impact/impact-types";

const VEHICLE_SOURCE =
  "Typical per-passenger emission factors; varies by vehicle";

interface QualitativeFactorInput {
  id: FactorId;
  group: ImpactGroup;
  appliesTo: ImpactScope;
  label: string;
  note: string;
  source: string;
}

function emissionFactor(
  id: FactorId,
  label: string,
  kgCo2ePerTrip: number,
): ImpactFactor {
  return {
    id,
    label,
    group: "commute",
    appliesTo: "trip",
    effect: { kind: "emission_avoided", kgCo2ePerTrip },
    source: VEHICLE_SOURCE,
    confidence: "approximate",
  };
}

function qualitativeFactor({
  id,
  group,
  appliesTo,
  label,
  note,
  source,
}: QualitativeFactorInput): ImpactFactor {
  return {
    id,
    label,
    group,
    appliesTo,
    effect: { kind: "qualitative", note },
    source,
    confidence: "qualitative",
  };
}

/**
 * Trip, waste and housekeeping factors.
 */
export const LIFESTYLE_FACTORS: readonly ImpactFactor[] = [
  emissionFactor("walk-or-cycle", "Walk or cycle instead of driving", 1.7),
  emissionFactor("metro-or-bus", "Use public transport", 1.2),
  emissionFactor("carpool", "Share a car trip", 0.85),
  qualitativeFactor({
    id: "avoid-open-burning",
    group: "waste",
    appliesTo: "outdoor",
    label: "Avoid burning waste or leaves",
    note: "Less smoke means fewer fine particles for the whole neighbourhood.",
    source:
      "Burning leaves, rubbish or biomass adds fine particles to the whole neighbourhood",
  }),
  qualitativeFactor({
    id: "wet-mop-dust",
    group: "housekeeping",
    appliesTo: "indoor",
    label: "Wet-mop floors",
    note: "Wet cleaning removes settled dust without stirring it back into the air.",
    source:
      "Wet mopping lifts less settled dust back into the air than dry sweeping",
  }),
];
