import type { ClientImpactFactor } from "@/lib/client/client-plan-schemas";

/**
 * Props for the plan's trip-emission factors.
 */
export interface WhatIfTripsProps {
  factors: readonly ClientImpactFactor[];
}

/**
 * Lists the plan's lower-emission trip choices with their CO2e values.
 */
export function WhatIfTrips({ factors }: WhatIfTripsProps) {
  if (factors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold">
        Lower-emission trips in your plan
      </h3>
      <ul className="space-y-1 text-sm">
        {factors.map((factor) => {
          const effect = factor.effect;
          if (effect.kind !== "emission_avoided") {
            return null;
          }
          return (
            <li key={factor.id}>
              <span className="font-medium">{factor.label}:</span> avoids about{" "}
              {effect.kgCo2ePerTrip} kg CO2e per 10 km trip.
            </li>
          );
        })}
      </ul>
    </div>
  );
}
