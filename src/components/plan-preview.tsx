import type { RefObject } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ClientPlanWithImpact } from "@/lib/api/client-plan-schemas";
import type { Language } from "@/lib/llm/prompts";

/**
 * Props for the first part of the generated plan.
 */
export interface PlanPreviewProps {
  plan: ClientPlanWithImpact;
  language: Language;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

/**
 * Shows the generated air summary until the full plan view is added.
 */
export function PlanPreview({
  plan,
  language,
  headingRef,
}: PlanPreviewProps) {
  return (
    <section
      aria-labelledby="plan-preview-heading"
      lang={language}
      className="space-y-4"
    >
      <h2
        id="plan-preview-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-xl font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Your plan
      </h2>
      <Card className="rounded-lg border border-border ring-0">
        <CardHeader>
          <CardTitle>
            <h3 className="text-lg font-semibold">
              {plan.airSummary.headline}
            </h3>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{plan.airSummary.explanation}</p>
          {plan.airSummary.sensitiveGroupNote !== null && (
            <p>{plan.airSummary.sensitiveGroupNote}</p>
          )}
          {plan.doctorNote !== null && (
            <p className="rounded-md border border-border bg-muted/50 p-3">
              {plan.doctorNote}
            </p>
          )}
          <p className="text-muted-foreground">
            This is not medical advice.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
