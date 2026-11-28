import type { ClientPlanWithImpact } from "@/lib/client/client-plan-schemas";
import { ImpactBadge } from "@/components/impact-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AREA_LABELS } from "@/components/plan/plan-display";

/**
 * Props for the sustainable alternatives section.
 */
export interface SustainableAlternativesProps {
  alternatives: ClientPlanWithImpact["sustainableAlternatives"];
}

/**
 * Renders lower-emission alternatives with their community benefit.
 */
export function SustainableAlternatives({
  alternatives,
}: SustainableAlternativesProps) {
  return (
    <section aria-labelledby="alternatives-heading" className="space-y-4">
      <h2
        id="alternatives-heading"
        className="text-xl font-semibold tracking-tight"
      >
        Sustainable alternatives
      </h2>
      <div className="space-y-3">
        {alternatives.map((alternative, index) => (
          <Card
            key={`${alternative.swap}-${index}`}
            className="rounded-lg border border-border ring-0"
          >
            <CardHeader>
              <CardTitle>
                <h3 className="text-base font-semibold">{alternative.swap}</h3>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <span className="inline-block rounded-sm border border-border px-2 py-0.5 text-xs">
                {AREA_LABELS[alternative.area]}
              </span>
              <p>
                <span className="font-medium">Why it helps: </span>
                {alternative.whyItHelps}
              </p>
              <p>
                <span className="font-medium">For the community: </span>
                {alternative.communityBenefit}
              </p>
              {alternative.factorIds.map((factor) => (
                <ImpactBadge key={factor.id} factor={factor} />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
