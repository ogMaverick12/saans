import type { RefObject } from "react";
import { AskBox } from "@/components/ask-box";
import { PlanView } from "@/components/plan-view";
import type { ClientAirDigest } from "@/lib/client/client-schemas";
import type { ClientPlanWithImpact } from "@/lib/client/client-plan-schemas";
import type { PlaceInput } from "@/lib/api/schemas";
import type { Language } from "@/lib/llm/prompts";
import type { Profile } from "@/lib/profile/schema";

/**
 * Props for the generated plan and its follow-up question box.
 */
export interface PlanResultProps {
  plan: ClientPlanWithImpact;
  digest: ClientAirDigest;
  profile: Profile;
  place: PlaceInput;
  language: Language;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

/**
 * Shows the plan, its tools and the Ask Saans follow-up box.
 */
export function PlanResult({
  plan,
  digest,
  profile,
  place,
  language,
  headingRef,
}: PlanResultProps) {
  return (
    <div className="space-y-8">
      <PlanView
        plan={plan}
        digest={digest}
        profile={profile}
        language={language}
        headingRef={headingRef}
      />

      <section
        aria-labelledby="ask-heading"
        lang={language}
        data-print-hide
        className="space-y-4"
      >
        <h2 id="ask-heading" className="text-xl font-semibold tracking-tight">
          Ask Saans
        </h2>
        <p className="text-sm text-muted-foreground">
          Ask a follow-up question about your plan.
        </p>
        <AskBox place={place} plan={plan} language={language} />
      </section>
    </div>
  );
}
