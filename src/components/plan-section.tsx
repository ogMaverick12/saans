"use client";

import dynamic from "next/dynamic";
import type { RefObject } from "react";
import { ErrorNotice } from "@/components/error-notice";
import { PlanSkeleton } from "@/components/plan-skeleton";
import type { ClientAirDigest } from "@/lib/client/client-schemas";
import type { ClientPlanWithImpact } from "@/lib/client/client-plan-schemas";
import type { PlaceInput } from "@/lib/api/schemas";
import { FALLBACK_ERROR_MESSAGE } from "@/lib/config";
import type { PlanFlowState } from "@/hooks/plan-flow";
import type { Profile } from "@/lib/profile/schema";

const PlanResult = dynamic(
  () => import("@/components/plan-result").then((module) => module.PlanResult),
  { ssr: false },
);

interface ReadyPlanState extends PlanFlowState {
  status: "planReady";
  plan: ClientPlanWithImpact;
  air: ClientAirDigest;
  profile: Profile;
  place: PlaceInput;
}

/**
 * Narrows the flow to a state that has every value the plan view needs.
 */
function isPlanReady(state: PlanFlowState): state is ReadyPlanState {
  return (
    state.status === "planReady" &&
    state.plan !== null &&
    state.air !== null &&
    state.profile !== null &&
    state.place !== null
  );
}

export interface PlanSectionProps {
  state: PlanFlowState;
  onRetry: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

/**
 * Maps the plan part of the flow to its visible states.
 */
export function PlanSection({ state, onRetry, headingRef }: PlanSectionProps) {
  if (state.status === "planLoading") {
    return <PlanSkeleton />;
  }
  if (state.status === "error" && state.errorSource === "plan") {
    return (
      <ErrorNotice
        title="We could not write your plan"
        message={state.error ?? FALLBACK_ERROR_MESSAGE}
        onRetry={onRetry}
      />
    );
  }
  if (!isPlanReady(state)) {
    return null;
  }

  return (
    <PlanResult
      plan={state.plan}
      digest={state.air}
      profile={state.profile}
      place={state.place}
      language={state.planLanguage}
      headingRef={headingRef}
    />
  );
}
