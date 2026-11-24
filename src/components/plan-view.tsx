"use client";

import { useEffect, type RefObject } from "react";
import { CommunityActions } from "@/components/plan/community-actions";
import { DailyRoutine } from "@/components/plan/daily-routine";
import { IndoorHacks } from "@/components/plan/indoor-hacks";
import { PlanSafetyNote } from "@/components/plan/plan-safety-note";
import { PlanSummary } from "@/components/plan/plan-summary";
import { PlanTools } from "@/components/plan/plan-tools";
import { SustainableAlternatives } from "@/components/plan/sustainable-alternatives";
import { WhatIfPanel } from "@/components/what-if-panel";
import type { ClientAirDigest } from "@/lib/api/client-schemas";
import type { ClientPlanWithImpact } from "@/lib/api/client-plan-schemas";
import type { Language } from "@/lib/llm/prompts";
import type { Profile } from "@/lib/profile/schema";

/**
 * Props for the full generated plan.
 */
export interface PlanViewProps {
  plan: ClientPlanWithImpact;
  digest: ClientAirDigest;
  profile: Profile;
  language: Language;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

/**
 * Renders the air summary, five plan sections and the what-if simulator.
 */
export function PlanView({
  plan,
  digest,
  profile,
  language,
  headingRef,
}: PlanViewProps) {
  useEffect(() => {
    headingRef.current?.focus();
  }, [headingRef]);

  return (
    <section
      aria-labelledby="plan-heading"
      lang={language}
      className="space-y-8"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="plan-heading"
            ref={headingRef}
            tabIndex={-1}
            className="text-xl font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Your plan
          </h2>
          <PlanTools plan={plan} language={language} />
        </div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
          <PlanSummary plan={plan} />
          <PlanSafetyNote doctorNote={plan.doctorNote} />
        </div>
      </div>

      <DailyRoutine items={plan.dailyRoutine} />
      <IndoorHacks hacks={plan.indoorHacks} />
      <SustainableAlternatives alternatives={plan.sustainableAlternatives} />
      <WhatIfPanel digest={digest} profile={profile} plan={plan} />
      <CommunityActions actions={plan.communityActions} />
    </section>
  );
}
