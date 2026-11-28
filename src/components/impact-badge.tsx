import type { ImpactFactor } from "@/lib/impact/impact-types";

export interface ImpactBadgeProps {
  factor: ImpactFactor;
}

/**
 * Turns a factor's effect into a plain sentence with its numbers.
 */
function effectText(factor: ImpactFactor): string {
  const effect = factor.effect;
  if (effect.kind === "exposure_reduction") {
    return `Typically cuts what you breathe in by about ${effect.typicalPct}% (range ${effect.lowPct}-${effect.highPct}%)`;
  }
  if (effect.kind === "emission_avoided") {
    return `Avoids about ${effect.kgCo2ePerTrip} kg CO2e per 10 km trip compared with driving alone`;
  }
  if (effect.kind === "qualitative") {
    return effect.note;
  }
  return "Estimated from today's cleanest forecast window.";
}

/**
 * Shows one factor's label, estimated effect and source.
 */
export function ImpactBadge({ factor }: ImpactBadgeProps) {
  return (
    <div className="space-y-1 rounded-md border border-border bg-muted/30 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{factor.label}</span>
        <span className="rounded-sm border border-border px-1.5 py-0.5 text-xs">
          Estimate
        </span>
      </div>
      <p>{effectText(factor)}</p>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          Source
        </summary>
        <p className="mt-1">{factor.source}</p>
      </details>
    </div>
  );
}
