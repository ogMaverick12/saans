import { describe, expect, it } from "vitest";
import {
  INITIAL_PLAN_FLOW_STATE,
  planFlowReducer,
  type PlanFlowState,
} from "@/hooks/plan-flow";
import type { PlaceInput } from "@/lib/api/schemas";
import { buildClientPlan } from "../lib/client/client-test-data";
import { buildDigest, buildProfile } from "../lib/impact/test-data";

const PLACE: PlaceInput = {
  name: "Delhi",
  latitude: 28.61,
  longitude: 77.21,
  countryCode: "IN",
};

const AIR = buildDigest();
const PLAN = buildClientPlan();
const PROFILE = buildProfile();

describe("planFlowReducer", () => {
  it("moves from idle through air to a ready plan", () => {
    let state: PlanFlowState = planFlowReducer(INITIAL_PLAN_FLOW_STATE, {
      type: "PLACE_SELECTED",
      place: PLACE,
    });
    expect(state.status).toBe("placeSelected");
    expect(state.place).toEqual(PLACE);

    state = planFlowReducer(state, { type: "AIR_LOADING" });
    expect(state.status).toBe("airLoading");

    state = planFlowReducer(state, { type: "AIR_READY", air: AIR });
    expect(state.status).toBe("airReady");
    expect(state.air).toEqual(AIR);

    state = planFlowReducer(state, {
      type: "PLAN_LOADING",
      language: "hi",
      profile: PROFILE,
    });
    expect(state.status).toBe("planLoading");
    expect(state.planLanguage).toBe("hi");
    expect(state.profile).toEqual(PROFILE);

    state = planFlowReducer(state, {
      type: "PLAN_READY",
      plan: PLAN,
      digest: AIR,
    });
    expect(state.status).toBe("planReady");
    expect(state.plan).toEqual(PLAN);
    expect(state.air).toEqual(AIR);
    expect(state.error).toBeNull();
  });

  it("records an air failure and clears it when a new place is chosen", () => {
    let state = planFlowReducer(INITIAL_PLAN_FLOW_STATE, {
      type: "PLACE_SELECTED",
      place: PLACE,
    });
    state = planFlowReducer(state, {
      type: "FAILED",
      source: "air",
      message: "Could not reach the app.",
    });
    expect(state.status).toBe("error");
    expect(state.errorSource).toBe("air");
    expect(state.error).toBe("Could not reach the app.");

    state = planFlowReducer(state, {
      type: "PLACE_SELECTED",
      place: { ...PLACE, name: "Mumbai" },
    });
    expect(state.status).toBe("placeSelected");
    expect(state.error).toBeNull();
    expect(state.errorSource).toBeNull();
  });

  it("keeps air when a plan fails, then resets to idle", () => {
    let state = planFlowReducer(INITIAL_PLAN_FLOW_STATE, {
      type: "PLACE_SELECTED",
      place: PLACE,
    });
    state = planFlowReducer(state, { type: "AIR_READY", air: AIR });
    state = planFlowReducer(state, {
      type: "FAILED",
      source: "plan",
      message: "The language model is not configured.",
    });

    expect(state.status).toBe("error");
    expect(state.air).toEqual(AIR);
    expect(state.plan).toBeNull();

    state = planFlowReducer(state, { type: "RESET" });
    expect(state).toEqual(INITIAL_PLAN_FLOW_STATE);
  });
});
