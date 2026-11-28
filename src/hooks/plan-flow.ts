import type { ClientAirDigest } from "@/lib/client/client-schemas";
import type { ClientPlanWithImpact } from "@/lib/client/client-plan-schemas";
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
  profile: Profile | null;
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
  | { type: "PLAN_LOADING"; language: Language; profile: Profile }
  | {
      type: "PLAN_READY";
      plan: ClientPlanWithImpact;
      digest: ClientAirDigest;
    }
  | { type: "FAILED"; source: PlanFlowErrorSource; message: string }
  | { type: "RESET" };

/**
 * The profile and language choices needed to generate a plan.
 */
export interface GeneratePlanInput {
  profile: Profile;
  language: Language;
  readingMode: ReadingMode;
}

/**
 * The flow before a place has been chosen.
 */
export const INITIAL_PLAN_FLOW_STATE: PlanFlowState = {
  status: "idle",
  place: null,
  air: null,
  plan: null,
  profile: null,
  error: null,
  errorSource: null,
  planLanguage: "en",
};

type PlanFlowHandler = (
  state: PlanFlowState,
  action: PlanFlowAction,
) => PlanFlowState;

const PLAN_FLOW_HANDLERS: {
  [K in PlanFlowAction["type"]]: (
    state: PlanFlowState,
    action: Extract<PlanFlowAction, { type: K }>,
  ) => PlanFlowState;
} = {
  PLACE_SELECTED: (_state, action) => ({
    ...INITIAL_PLAN_FLOW_STATE,
    status: "placeSelected",
    place: action.place,
  }),
  AIR_LOADING: (state) => ({
    ...state,
    status: "airLoading",
    plan: null,
    error: null,
    errorSource: null,
  }),
  AIR_READY: (state, action) => ({
    ...state,
    status: "airReady",
    air: action.air,
    error: null,
    errorSource: null,
  }),
  PLAN_LOADING: (state, action) => ({
    ...state,
    status: "planLoading",
    plan: null,
    error: null,
    errorSource: null,
    planLanguage: action.language,
    profile: action.profile,
  }),
  PLAN_READY: (state, action) => ({
    ...state,
    status: "planReady",
    plan: action.plan,
    air: action.digest,
    error: null,
    errorSource: null,
  }),
  FAILED: (state, action) => ({
    ...state,
    status: "error",
    error: action.message,
    errorSource: action.source,
    plan: action.source === "plan" ? null : state.plan,
  }),
  RESET: () => INITIAL_PLAN_FLOW_STATE,
};

/**
 * Applies one action to the plan flow without side effects.
 */
export function planFlowReducer(
  state: PlanFlowState,
  action: PlanFlowAction,
): PlanFlowState {
  const handler = PLAN_FLOW_HANDLERS[action.type] as PlanFlowHandler;
  return handler(state, action);
}
