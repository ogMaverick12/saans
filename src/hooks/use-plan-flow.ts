import { useCallback, useReducer, useRef } from "react";
import {
  fetchAirDigest,
  isAbortError,
  requestPlan,
  toClientMessage,
} from "@/lib/api/client";
import type { ClientAirDigest } from "@/lib/api/client-schemas";
import type { ClientPlanWithImpact } from "@/lib/api/client-plan-schemas";
import type { PlaceInput } from "@/lib/api/schemas";
import type { Language, ReadingMode } from "@/lib/llm/prompts";
import type { Profile } from "@/lib/profile/schema";

/**
 * One step in the air-and-plan request flow.
 */
export type PlanFlowStatus =
  | "idle"
  | "placeSelected"
  | "airLoading"
  | "airReady"
  | "planLoading"
  | "planReady"
  | "error";

/**
 * Which request failed when the flow is in the error state.
 */
export type PlanFlowErrorSource = "air" | "plan";

/**
 * Everything the plan flow knows at one point in time.
 */
export interface PlanFlowState {
  status: PlanFlowStatus;
  place: PlaceInput | null;
  air: ClientAirDigest | null;
  plan: ClientPlanWithImpact | null;
  error: string | null;
  errorSource: PlanFlowErrorSource | null;
  planLanguage: Language;
}

/**
 * Actions that move the plan flow between states.
 */
export type PlanFlowAction =
  | { type: "PLACE_SELECTED"; place: PlaceInput }
  | { type: "AIR_LOADING" }
  | { type: "AIR_READY"; air: ClientAirDigest }
  | { type: "PLAN_LOADING"; language: Language }
  | { type: "PLAN_READY"; plan: ClientPlanWithImpact }
  | { type: "FAILED"; source: PlanFlowErrorSource; message: string }
  | { type: "RESET" };

/**
 * The flow before a place has been chosen.
 */
export const INITIAL_PLAN_FLOW_STATE: PlanFlowState = {
  status: "idle",
  place: null,
  air: null,
  plan: null,
  error: null,
  errorSource: null,
  planLanguage: "en",
};

/**
 * Applies one action to the plan flow without side effects.
 */
export function planFlowReducer(
  state: PlanFlowState,
  action: PlanFlowAction,
): PlanFlowState {
  switch (action.type) {
    case "PLACE_SELECTED":
      return {
        ...INITIAL_PLAN_FLOW_STATE,
        status: "placeSelected",
        place: action.place,
      };
    case "AIR_LOADING":
      return {
        ...state,
        status: "airLoading",
        plan: null,
        error: null,
        errorSource: null,
      };
    case "AIR_READY":
      return {
        ...state,
        status: "airReady",
        air: action.air,
        error: null,
        errorSource: null,
      };
    case "PLAN_LOADING":
      return {
        ...state,
        status: "planLoading",
        plan: null,
        error: null,
        errorSource: null,
        planLanguage: action.language,
      };
    case "PLAN_READY":
      return {
        ...state,
        status: "planReady",
        plan: action.plan,
        error: null,
        errorSource: null,
      };
    case "FAILED":
      return {
        ...state,
        status: "error",
        error: action.message,
        errorSource: action.source,
        plan: action.source === "plan" ? null : state.plan,
      };
    case "RESET":
      return INITIAL_PLAN_FLOW_STATE;
  }
}

/**
 * The profile and language choices needed to generate a plan.
 */
export interface GeneratePlanInput {
  profile: Profile;
  language: Language;
  readingMode: ReadingMode;
}

/**
 * Loads air for a place, then generates a plan on request.
 */
export function usePlanFlow() {
  const [state, dispatch] = useReducer(
    planFlowReducer,
    INITIAL_PLAN_FLOW_STATE,
  );
  const airRequest = useRef(0);
  const planRequest = useRef(0);
  const airAbort = useRef<AbortController | null>(null);
  const planAbort = useRef<AbortController | null>(null);
  const lastPlanInput = useRef<GeneratePlanInput | null>(null);

  const loadAir = useCallback((place: PlaceInput) => {
    airAbort.current?.abort();
    const controller = new AbortController();
    airAbort.current = controller;
    const requestId = ++airRequest.current;
    dispatch({ type: "AIR_LOADING" });
    fetchAirDigest(place, { signal: controller.signal })
      .then((air) => {
        if (requestId === airRequest.current) {
          dispatch({ type: "AIR_READY", air });
        }
      })
      .catch((error: unknown) => {
        if (requestId !== airRequest.current || isAbortError(error)) {
          return;
        }
        dispatch({
          type: "FAILED",
          source: "air",
          message: toClientMessage(error),
        });
      });
  }, []);

  const selectPlace = useCallback(
    (place: PlaceInput) => {
      planAbort.current?.abort();
      planRequest.current += 1;
      lastPlanInput.current = null;
      dispatch({ type: "PLACE_SELECTED", place });
      loadAir(place);
    },
    [loadAir],
  );

  const generatePlan = useCallback(
    (input: GeneratePlanInput) => {
      if (state.place === null) {
        return;
      }
      lastPlanInput.current = input;
      planAbort.current?.abort();
      const controller = new AbortController();
      planAbort.current = controller;
      const requestId = ++planRequest.current;
      dispatch({ type: "PLAN_LOADING", language: input.language });
      requestPlan(
        { place: state.place, ...input },
        { signal: controller.signal },
      )
        .then(({ plan }) => {
          if (requestId === planRequest.current) {
            dispatch({ type: "PLAN_READY", plan });
          }
        })
        .catch((error: unknown) => {
          if (requestId !== planRequest.current || isAbortError(error)) {
            return;
          }
          dispatch({
            type: "FAILED",
            source: "plan",
            message: toClientMessage(error),
          });
        });
    },
    [state.place],
  );

  const retry = useCallback(() => {
    if (state.errorSource === "air" && state.place !== null) {
      loadAir(state.place);
      return;
    }
    if (state.errorSource === "plan" && lastPlanInput.current !== null) {
      generatePlan(lastPlanInput.current);
    }
  }, [state.errorSource, state.place, loadAir, generatePlan]);

  const reset = useCallback(() => {
    airAbort.current?.abort();
    planAbort.current?.abort();
    airRequest.current += 1;
    planRequest.current += 1;
    lastPlanInput.current = null;
    dispatch({ type: "RESET" });
  }, []);

  return { state, selectPlace, generatePlan, retry, reset };
}
