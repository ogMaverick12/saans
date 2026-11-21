import { z, type ZodType } from "zod";
import {
  AirDigestSchema,
  GeocodeMatchSchema,
  type ClientAirDigest,
  type ClientGeocodeMatch,
} from "@/lib/api/client-schemas";
import {
  PlanResponseSchema,
  type ClientPlanResponse,
} from "@/lib/api/client-plan-schemas";
import type { AskRequest, PlanRequest, PlaceInput } from "@/lib/api/schemas";
import { APP_ERROR_CODES, type AppErrorCode } from "@/lib/errors";
import { AskSchema, type Ask } from "@/lib/llm/plan-schema";

const MAX_ERROR_MESSAGE_CHARS = 1_000;
const NETWORK_MESSAGE =
  "Could not reach the app. Check your connection and try again.";
const INVALID_RESPONSE_MESSAGE =
  "The app received an unexpected response. Please try again.";
const GENERIC_CLIENT_MESSAGE = "Something went wrong. Please try again.";

/**
 * A stable client error code, including transport and parsing failures.
 */
export type ClientErrorCode =
  | AppErrorCode
  | "NETWORK"
  | "INVALID_RESPONSE";

/**
 * An error raised by a browser API request with a message safe to show a user.
 */
export class ClientError extends Error {
  readonly code: ClientErrorCode;

  readonly safeMessage: string;

  /**
   * Creates a client error from a stable code and a user-safe message.
   */
  constructor(code: ClientErrorCode, safeMessage: string) {
    super(safeMessage);
    this.name = "ClientError";
    this.code = code;
    this.safeMessage = safeMessage;
  }
}

/**
 * The fetch signature the browser client accepts, so tests can inject a fake.
 */
export type ClientFetch = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

/**
 * Per-request options for the browser client.
 */
export interface ClientRequestOptions {
  signal?: AbortSignal;
  fetchImpl?: ClientFetch;
}

const ApiFailureSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.enum(APP_ERROR_CODES),
    message: z.string().min(1).max(MAX_ERROR_MESSAGE_CHARS),
  }),
});

const ApiSuccessSchema = z.object({
  ok: z.literal(true),
  data: z.unknown(),
});

const ApiEnvelopeSchema = z.discriminatedUnion("ok", [
  ApiSuccessSchema,
  ApiFailureSchema,
]);

const defaultFetch: ClientFetch = (input, init) => fetch(input, init);

/**
 * Checks whether an unknown value is an abort error from fetch.
 */
export function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

/**
 * Returns the safe message for a client failure.
 */
export function toClientMessage(error: unknown): string {
  return error instanceof ClientError
    ? error.safeMessage
    : GENERIC_CLIENT_MESSAGE;
}

/**
 * Builds a JSON POST request body.
 */
function jsonPost(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

/**
 * Calls one API route, validates its envelope and parses its data.
 */
async function requestJson<T>(
  input: string,
  schema: ZodType<T>,
  init: RequestInit,
  options: ClientRequestOptions,
): Promise<T> {
  const fetchImpl = options.fetchImpl ?? defaultFetch;
  let response: Response;
  try {
    response = await fetchImpl(input, { ...init, signal: options.signal });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new ClientError("NETWORK", NETWORK_MESSAGE);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ClientError("INVALID_RESPONSE", INVALID_RESPONSE_MESSAGE);
  }

  const envelope = ApiEnvelopeSchema.safeParse(payload);
  if (!envelope.success) {
    throw new ClientError("INVALID_RESPONSE", INVALID_RESPONSE_MESSAGE);
  }
  if (!response.ok && envelope.data.ok) {
    throw new ClientError("INVALID_RESPONSE", INVALID_RESPONSE_MESSAGE);
  }
  if (!envelope.data.ok) {
    throw new ClientError(
      envelope.data.error.code,
      envelope.data.error.message,
    );
  }

  const parsed = schema.safeParse(envelope.data.data);
  if (!parsed.success) {
    throw new ClientError("INVALID_RESPONSE", INVALID_RESPONSE_MESSAGE);
  }
  return parsed.data;
}

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
