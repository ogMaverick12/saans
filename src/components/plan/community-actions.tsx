import type { ClientPlanWithImpact } from "@/lib/api/client-plan-schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Props for the community actions section.
 */
export interface CommunityActionsProps {
  actions: ClientPlanWithImpact["communityActions"];
}

/**
 * Renders what families and communities can do together.
 */
export function CommunityActions({ actions }: CommunityActionsProps) {
  return (
    <section aria-labelledby="community-heading" className="space-y-4">
      <h2
        id="community-heading"
        className="text-xl font-semibold tracking-tight"
      >
        What families and communities can do
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((action, index) => (
          <Card
            key={`${action.title}-${index}`}
            className="rounded-lg border border-border ring-0"
          >
            <CardHeader>
              <CardTitle>
                <h3 className="text-base font-semibold">{action.title}</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{action.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
