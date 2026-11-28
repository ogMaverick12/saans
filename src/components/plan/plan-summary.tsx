import type { ClientPlanWithImpact } from "@/lib/client/client-plan-schemas";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export interface PlanSummaryProps {
  plan: ClientPlanWithImpact;
}

/**
 * Shows the plan's air summary and sensitive-group note.
 */
export function PlanSummary({ plan }: PlanSummaryProps) {
  const { airSummary } = plan;

  return (
    <Card className="rounded-lg border border-border ring-0">
      <CardHeader>
        <p className="text-lg font-semibold">{airSummary.headline}</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{airSummary.explanation}</p>
        {airSummary.sensitiveGroupNote !== null && (
          <p>{airSummary.sensitiveGroupNote}</p>
        )}
      </CardContent>
    </Card>
  );
}
