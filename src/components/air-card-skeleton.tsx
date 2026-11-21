import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * A static placeholder shown while today's air is loading.
 */
export function AirCardSkeleton() {
  return (
    <Card
      role="status"
      aria-busy="true"
      className="rounded-lg border border-border ring-0"
    >
      <span className="sr-only">Loading today&apos;s air.</span>
      <CardHeader>
        <div className="h-6 w-32 rounded bg-muted" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-12 w-24 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </CardContent>
    </Card>
  );
}
