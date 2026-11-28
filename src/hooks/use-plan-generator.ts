import { useCallback, useRef, type Dispatch } from "react";
import {
  isAbortError,
  requestPlan,
  toClientMessage,
} from "@/lib/client/client";
import type { PlaceInput } from "@/lib/api/schemas";
import type { GeneratePlanInput, PlanFlowAction } from "@/hooks/plan-flow";

/**
 * Generates plans for the selected place and repeats the last request on retry.
 */
export interface PlanGenerator {
  generatePlan: (input: GeneratePlanInput) => void;
  retryPlan: () => void;
  cancelPlan: () => void;
}

/**
 * Inputs needed to start one plan request.
 */
interface PlanRequestOptions {
  place: PlaceInput;
  input: GeneratePlanInput;
  dispatch: Dispatch<PlanFlowAction>;
  requestId: { current: number };
  abort: { current: AbortController | null };
}

/**
 * Dispatches the loading state for a plan request.
 */
function dispatchPlanLoading(
  dispatch: Dispatch<PlanFlowAction>,
  input: GeneratePlanInput,
): void {
  dispatch({
    type: "PLAN_LOADING",
    language: input.language,
    profile: input.profile,
  });
}

/**
 * Dispatches a safe failure for a plan request.
 */
function dispatchPlanFailure(
  dispatch: Dispatch<PlanFlowAction>,
  error: unknown,
): void {
  dispatch({
    type: "FAILED",
    source: "plan",
    message: toClientMessage(error),
  });
}

/**
 * Starts a plan request, ignoring stale and aborted responses.
 */
function startPlanRequest({
  place,
  input,
  dispatch,
  requestId,
  abort,
}: PlanRequestOptions): void {
  abort.current?.abort();
  const controller = new AbortController();
  abort.current = controller;
  const currentRequest = ++requestId.current;
  dispatchPlanLoading(dispatch, input);
  requestPlan({ place, ...input }, { signal: controller.signal })
    .then(({ plan, digest }) => {
      if (currentRequest === requestId.current) {
        dispatch({ type: "PLAN_READY", plan, digest });
      }
    })
    .catch((error: unknown) => {
      if (currentRequest !== requestId.current || isAbortError(error)) {
        return;
      }
      dispatchPlanFailure(dispatch, error);
    });
}

/**
 * Requests a plan, ignoring stale and aborted responses, and remembers the last input.
 */
export function usePlanGenerator(
  dispatch: Dispatch<PlanFlowAction>,
  place: PlaceInput | null,
): PlanGenerator {
  const requestId = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const lastInput = useRef<GeneratePlanInput | null>(null);

  const generatePlan = useCallback(
    (input: GeneratePlanInput) => {
      if (place === null) {
        return;
      }
      lastInput.current = input;
      startPlanRequest({ place, input, dispatch, requestId, abort });
    },
    [dispatch, place],
  );

  const retryPlan = useCallback(() => {
    if (lastInput.current !== null) {
      generatePlan(lastInput.current);
    }
  }, [generatePlan]);

  const cancelPlan = useCallback(() => {
    abort.current?.abort();
    requestId.current += 1;
    lastInput.current = null;
  }, []);

  return { generatePlan, retryPlan, cancelPlan };
}
