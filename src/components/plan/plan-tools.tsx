import { PrintButton } from "@/components/print-button";
import { ReadAloudButton } from "@/components/read-aloud-button";
import type { ClientPlanWithImpact } from "@/lib/client/client-plan-schemas";
import type { Language } from "@/lib/llm/prompts";

/**
 * Props for the plan's read-aloud and print controls.
 */
export interface PlanToolsProps {
  plan: ClientPlanWithImpact;
  language: Language;
}

/**
 * Shows the read-aloud and print controls beside the plan heading.
 */
export function PlanTools({ plan, language }: PlanToolsProps) {
  return (
    <div data-print-hide className="flex flex-wrap gap-2">
      <ReadAloudButton plan={plan} language={language} />
      <PrintButton />
    </div>
  );
}
