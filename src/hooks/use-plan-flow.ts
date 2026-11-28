import { useCallback, useReducer, type Dispatch } from "react";
import { useAirLoader } from "@/hooks/use-air-loader";
import { usePlanGenerator } from "@/hooks/use-plan-generator";
import type { PlaceInput } from "@/lib/api/schemas";
import {
  INITIAL_PLAN_FLOW_STATE,
  planFlowReducer,
  type PlanFlowAction,
  type PlanFlowState,
} from "@/hooks/plan-flow";

/**
 * Returns a callback that selects a place and loads its air.
 */
function usePlaceSelection(
  dispatch: Dispatch<PlanFlowAction>,
  loadAir: (place: PlaceInput) => void,
  cancelPlan: () => void,
) {
  return useCallback(
    (place: PlaceInput) => {
      cancelPlan();
      dispatch({ type: "PLACE_SELECTED", place });
      loadAir(place);
    },
    [cancelPlan, dispatch, loadAir],
  );
}

/**
 * Returns a callback that retries whichever request failed last.
 */
function useRetry(
  state: PlanFlowState,
  loadAir: (place: PlaceInput) => void,
  retryPlan: () => void,
) {
  return useCallback(() => {
    if (state.errorSource === "air" && state.place !== null) {
      loadAir(state.place);
      return;
    }
    if (state.errorSource === "plan") {
      retryPlan();
    }
  }, [state.errorSource, state.place, loadAir, retryPlan]);
}

/**
 * Returns a callback that cancels requests and resets the flow.
 */
function useReset(
  dispatch: Dispatch<PlanFlowAction>,
  cancelAir: () => void,
  cancelPlan: () => void,
) {
  return useCallback(() => {
    cancelAir();
    cancelPlan();
    dispatch({ type: "RESET" });
  }, [cancelAir, cancelPlan, dispatch]);
}

/**
 * Loads air for a place, then generates a plan on request.
 */
export function usePlanFlow() {
  const [state, dispatch] = useReducer(
    planFlowReducer,
    INITIAL_PLAN_FLOW_STATE,
  );
  const { loadAir, cancelAir } = useAirLoader(dispatch);
  const { generatePlan, retryPlan, cancelPlan } = usePlanGenerator(
    dispatch,
    state.place,
  );

  const selectPlace = usePlaceSelection(dispatch, loadAir, cancelPlan);
  const retry = useRetry(state, loadAir, retryPlan);
  const reset = useReset(dispatch, cancelAir, cancelPlan);

  return { state, selectPlace, generatePlan, retry, reset };
}
