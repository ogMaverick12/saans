import type {
  FactorId,
  ImpactFactor,
  ImpactGroup,
  ImpactScope,
} from "@/lib/impact/impact-factors";

const VEHICLE_SOURCE =
  "Typical per-passenger emission factors; varies by vehicle";

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

function qualitativeFactor(
  id: FactorId,
  group: ImpactGroup,
  appliesTo: ImpactScope,
  label: string,
  note: string,
  source: string,
): ImpactFactor {
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
  qualitativeFactor(
    "avoid-open-burning",
    "waste",
    "outdoor",
    "Avoid burning waste or leaves",
    "Less smoke means fewer fine particles for the whole neighbourhood.",
    "Burning leaves, rubbish or biomass adds fine particles to the whole neighbourhood",
  ),
  qualitativeFactor(
    "wet-mop-dust",
    "housekeeping",
    "indoor",
    "Wet-mop floors",
    "Wet cleaning removes settled dust without stirring it back into the air.",
    "Wet mopping lifts less settled dust back into the air than dry sweeping",
  ),
];
