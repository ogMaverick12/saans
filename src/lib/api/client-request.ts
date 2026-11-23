import { z, type ZodType } from "zod";
import {
  ClientError,
  isAbortError,
  type ClientFetch,
  type ClientRequestOptions,
} from "@/lib/api/client-errors";
import { APP_ERROR_CODES } from "@/lib/errors";

const MAX_ERROR_MESSAGE_CHARS = 1_000;
const NETWORK_MESSAGE =
  "Could not reach the app. Check your connection and try again.";
const INVALID_RESPONSE_MESSAGE =
  "The app received an unexpected response. Please try again.";

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
 * Builds a JSON POST request body.
 */
export function jsonPost(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

/**
 * Calls one API route, validates its envelope and parses its data.
 */
export async function requestJson<T>(
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
