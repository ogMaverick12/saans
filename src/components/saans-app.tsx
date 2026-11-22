"use client";

import { useEffect, useRef } from "react";
import { AirCard } from "@/components/air-card";
import { AirCardSkeleton } from "@/components/air-card-skeleton";
import { ErrorNotice } from "@/components/error-notice";
import { LocationSearch } from "@/components/location-search";
import { PlanResult } from "@/components/plan-result";
import { PlanSkeleton } from "@/components/plan-skeleton";
import { ProfileForm } from "@/components/profile-form";
import { usePlanFlow, type PlanFlowState } from "@/hooks/use-plan-flow";

const FALLBACK_ERROR_MESSAGE = "Please try again.";

/**
 * Builds the polite announcement for the current flow state.
 */
function announcementFor(state: PlanFlowState): string {
  const placeName = state.place?.name ?? "this place";
  if (state.status === "airLoading") {
    return `Loading today's air for ${placeName}.`;
  }
  if (state.status === "airReady") {
    return `Today's air for ${placeName} is ready.`;
  }
  if (state.status === "planLoading") {
    return "Writing your plan.";
  }
  if (state.status === "planReady") {
    return "Your plan is ready.";
  }
  return "";
}

/**
 * Wires the location search, air card and profile form into one flow.
 */
export function SaansApp() {
  const { state, selectPlace, generatePlan, retry } = usePlanFlow();
  const planHeadingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (state.status === "planReady") {
      planHeadingRef.current?.focus();
    }
  }, [state.status]);

  const showAirError =
    state.status === "error" && state.errorSource === "air";
  const showPlanError =
    state.status === "error" && state.errorSource === "plan";

  return (
    <div className="space-y-8">
      <section
        aria-labelledby="search-heading"
        data-print-hide
        className="space-y-4"
      >
        <h2
          id="search-heading"
          className="text-xl font-semibold tracking-tight"
        >
          Check your air
        </h2>
        <LocationSearch onSelect={selectPlace} />
      </section>

      <p aria-live="polite" className="sr-only">
        {announcementFor(state)}
      </p>

      {state.status === "airLoading" && <AirCardSkeleton />}
      {state.air !== null && <AirCard digest={state.air} />}
      {showAirError && (
        <ErrorNotice
          title="We could not load today's air"
          message={state.error ?? FALLBACK_ERROR_MESSAGE}
          onRetry={retry}
        />
      )}

      {state.air !== null && (
        <section
          aria-labelledby="profile-heading"
          data-print-hide
          className="space-y-4"
        >
          <h2
            id="profile-heading"
            className="text-xl font-semibold tracking-tight"
          >
            Tell us about your household
          </h2>
          <p className="text-sm text-muted-foreground">
            These answers shape your plan.
          </p>
          <ProfileForm
            onSubmit={generatePlan}
            isSubmitting={state.status === "planLoading"}
          />
        </section>
      )}

      {state.status === "planLoading" && <PlanSkeleton />}
      {showPlanError && (
        <ErrorNotice
          title="We could not write your plan"
          message={state.error ?? FALLBACK_ERROR_MESSAGE}
          onRetry={retry}
        />
      )}
      {state.status === "planReady" &&
        state.plan !== null &&
        state.air !== null &&
        state.profile !== null &&
        state.place !== null && (
          <PlanResult
            plan={state.plan}
            digest={state.air}
            profile={state.profile}
            place={state.place}
            language={state.planLanguage}
            headingRef={planHeadingRef}
          />
        )}
    </div>
  );
}
