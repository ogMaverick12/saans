import { z } from "zod";
import {
  AirDigestSchema,
  GeocodeMatchSchema,
  type ClientAirDigest,
  type ClientGeocodeMatch,
} from "@/lib/client/client-schemas";
import {
  PlanResponseSchema,
  type ClientPlanResponse,
} from "@/lib/client/client-plan-schemas";
import type { ClientRequestOptions } from "@/lib/client/client-errors";
import { jsonPost, requestJson } from "@/lib/client/client-request";
import type { AskRequest, PlanRequest, PlaceInput } from "@/lib/api/schemas";
import { AskSchema, type Ask } from "@/lib/llm/plan-schema";

/**
 * Client error type and helpers shared by every API call.
 */
export {
  ClientError,
  isAbortError,
  toClientMessage,
} from "@/lib/client/client-errors";
/**
 * Error and request-option types used by the browser client.
 */
export type {
  ClientErrorCode,
  ClientFetch,
  ClientRequestOptions,
} from "@/lib/client/client-errors";

/**
 * Searches for places by name.
 */
export function searchPlaces(
  query: string,
  options: ClientRequestOptions = {},
): Promise<ClientGeocodeMatch[]> {
  const params = new URLSearchParams({ q: query.trim() });
  return requestJson(
    `/api/geocode?${params.toString()}`,
    z.array(GeocodeMatchSchema),
    { method: "GET" },
    options,
  );
}

/**
 * Fetches today's air digest for a place.
 */
export function fetchAirDigest(
  place: PlaceInput,
  options: ClientRequestOptions = {},
): Promise<ClientAirDigest> {
  const params = new URLSearchParams({
    lat: String(place.latitude),
    lon: String(place.longitude),
    name: place.name,
  });
  return requestJson(
    `/api/air?${params.toString()}`,
    AirDigestSchema,
    { method: "GET" },
    options,
  );
}

/**
 * Generates a household plan with impact estimates.
 */
export function requestPlan(
  input: PlanRequest,
  options: ClientRequestOptions = {},
): Promise<ClientPlanResponse> {
  return requestJson("/api/plan", PlanResponseSchema, jsonPost(input), options);
}

/**
 * Asks one follow-up question about an existing plan.
 */
export function askQuestion(
  input: AskRequest,
  options: ClientRequestOptions = {},
): Promise<Ask> {
  return requestJson("/api/ask", AskSchema, jsonPost(input), options);
}
