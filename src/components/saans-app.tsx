"use client";

import "@/lib/zod-config";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { AirSection } from "@/components/air-section";
import { LocationSearch } from "@/components/location-search";
import { PlanSection } from "@/components/plan-section";
import { usePlanFlow } from "@/hooks/use-plan-flow";
import type { PlanFlowState } from "@/lib/plan-flow";

const ProfileForm = dynamic(
  () =>
    import("@/components/profile-form").then((module) => module.ProfileForm),
  {
    ssr: false,
    loading: () => (
      <p role="status" className="text-sm text-muted-foreground">
        Loading the household questions.
      </p>
    ),
  },
);

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

      <AirSection state={state} onRetry={retry} />

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

      <PlanSection state={state} onRetry={retry} headingRef={planHeadingRef} />
    </div>
  );
}
