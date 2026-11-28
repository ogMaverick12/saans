import { AirCard } from "@/components/air-card";
import { AirCardSkeleton } from "@/components/air-card-skeleton";
import { ErrorNotice } from "@/components/error-notice";
import { FALLBACK_ERROR_MESSAGE } from "@/lib/config";
import type { PlanFlowState } from "@/hooks/plan-flow";

/**
 * Props for the air card, loading skeleton and air error.
 */
export interface AirSectionProps {
  state: PlanFlowState;
  onRetry: () => void;
}

/**
 * Maps the air part of the plan flow to its visible states.
 */
export function AirSection({ state, onRetry }: AirSectionProps) {
  const showError = state.status === "error" && state.errorSource === "air";

  return (
    <>
      {state.status === "airLoading" && <AirCardSkeleton />}
      {state.air !== null && <AirCard digest={state.air} />}
      {showError && (
        <ErrorNotice
          title="We could not load today's air"
          message={state.error ?? FALLBACK_ERROR_MESSAGE}
          onRetry={onRetry}
        />
      )}
    </>
  );
}
