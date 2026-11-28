import type { ClientPlanWithImpact } from "@/lib/client/client-plan-schemas";
import { ImpactBadge } from "@/components/impact-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COST_LABELS, EFFORT_LABELS } from "@/components/plan/plan-display";

/**
 * Props for the indoor air-quality hacks section.
 */
export interface IndoorHacksProps {
  hacks: ClientPlanWithImpact["indoorHacks"];
}

/**
 * Renders indoor hacks with cost, effort and impact badges.
 */
export function IndoorHacks({ hacks }: IndoorHacksProps) {
  return (
    <section aria-labelledby="indoor-heading" className="space-y-4">
      <h2 id="indoor-heading" className="text-xl font-semibold tracking-tight">
        Indoor air quality hacks
      </h2>
      <div className="space-y-3">
        {hacks.map((hack, index) => (
          <Card
            key={`${hack.title}-${index}`}
            className="rounded-lg border border-border ring-0"
          >
            <CardHeader>
              <CardTitle>
                <h3 className="text-base font-semibold">{hack.title}</h3>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{hack.howTo}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-sm border border-border px-2 py-0.5">
                  Cost: {COST_LABELS[hack.cost]}
                </span>
                <span className="rounded-sm border border-border px-2 py-0.5">
                  Effort: {EFFORT_LABELS[hack.effort]}
                </span>
              </div>
              {hack.factorIds.map((factor) => (
                <ImpactBadge key={factor.id} factor={factor} />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
