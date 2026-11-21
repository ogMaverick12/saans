import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * A static placeholder shown while the plan is being written.
 */
export function PlanSkeleton() {
  return (
    <Card
      role="status"
      aria-busy="true"
      className="rounded-lg border border-border ring-0"
    >
      <span className="sr-only">Writing your plan.</span>
      <CardHeader>
        <div className="h-6 w-48 rounded bg-muted" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </CardContent>
    </Card>
  );
}
