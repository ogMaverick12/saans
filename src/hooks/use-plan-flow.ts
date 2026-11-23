import { useCallback, useReducer } from "react";
import { useAirLoader } from "@/hooks/use-air-loader";
import { usePlanGenerator } from "@/hooks/use-plan-generator";
import type { PlaceInput } from "@/lib/api/schemas";
import { INITIAL_PLAN_FLOW_STATE, planFlowReducer } from "@/lib/plan-flow";

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

  const selectPlace = useCallback(
    (place: PlaceInput) => {
      cancelPlan();
      dispatch({ type: "PLACE_SELECTED", place });
      loadAir(place);
    },
    [cancelPlan, loadAir],
  );

  const retry = useCallback(() => {
    if (state.errorSource === "air" && state.place !== null) {
      loadAir(state.place);
      return;
    }
    if (state.errorSource === "plan") {
      retryPlan();
    }
  }, [state.errorSource, state.place, loadAir, retryPlan]);

  const reset = useCallback(() => {
    cancelAir();
    cancelPlan();
    dispatch({ type: "RESET" });
  }, [cancelAir, cancelPlan]);

  return { state, selectPlace, generatePlan, retry, reset };
}
