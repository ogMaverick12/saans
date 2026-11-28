import { z, type ZodType } from "zod";
import {
  ClientError,
  isAbortError,
  type ClientFetch,
  type ClientRequestOptions,
} from "@/lib/client/client-errors";
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

type ApiEnvelope = z.infer<typeof ApiEnvelopeSchema>;

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
 * Reads a response body as JSON, mapping malformed bodies to a client error.
 */
async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ClientError("INVALID_RESPONSE", INVALID_RESPONSE_MESSAGE);
  }
}

/**
 * Validates the API envelope and checks that it agrees with the HTTP status.
 */
function parseEnvelope(payload: unknown, responseOk: boolean): ApiEnvelope {
  const envelope = ApiEnvelopeSchema.safeParse(payload);
  if (!envelope.success || (!responseOk && envelope.data.ok)) {
    throw new ClientError("INVALID_RESPONSE", INVALID_RESPONSE_MESSAGE);
  }
  return envelope.data;
}

/**
 * Returns the success data or raises the envelope's typed failure.
 */
function parseData<T>(envelope: ApiEnvelope, schema: ZodType<T>): T {
  if (!envelope.ok) {
    throw new ClientError(envelope.error.code, envelope.error.message);
  }
  const parsed = schema.safeParse(envelope.data);
  if (!parsed.success) {
    throw new ClientError("INVALID_RESPONSE", INVALID_RESPONSE_MESSAGE);
  }
  return parsed.data;
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

  const envelope = parseEnvelope(await readJson(response), response.ok);
  return parseData(envelope, schema);
}
