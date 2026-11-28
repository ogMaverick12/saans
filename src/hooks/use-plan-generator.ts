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
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      const currentRequest = ++requestId.current;
      dispatch({
        type: "PLAN_LOADING",
        language: input.language,
        profile: input.profile,
      });
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
          dispatch({
            type: "FAILED",
            source: "plan",
            message: toClientMessage(error),
          });
        });
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
