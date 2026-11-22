import type { ClientPlanWithImpact } from "@/lib/api/client-plan-schemas";
import { ImpactBadge } from "@/components/impact-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  sortByTimeBlock,
  TIME_BLOCK_LABELS,
} from "@/lib/llm/plan-display";

/**
 * Props for the daily routine section.
 */
export interface DailyRoutineProps {
  items: ClientPlanWithImpact["dailyRoutine"];
}

/**
 * Renders the plan's daily routine as a time-ordered list.
 */
export function DailyRoutine({ items }: DailyRoutineProps) {
  return (
    <section aria-labelledby="routine-heading" className="space-y-4">
      <h2
        id="routine-heading"
        className="text-xl font-semibold tracking-tight"
      >
        Low-emission daily routine
      </h2>
      <ol className="space-y-3">
        {sortByTimeBlock(items).map((item, index) => (
          <li key={`${item.timeBlock}-${index}`}>
            <Card className="rounded-lg border border-border ring-0">
              <CardHeader>
                <CardTitle>
                  <h3 className="text-base font-semibold">
                    {TIME_BLOCK_LABELS[item.timeBlock]}: {item.title}
                  </h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {item.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
                {item.factorIds.map((factor) => (
                  <ImpactBadge key={factor.id} factor={factor} />
                ))}
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
