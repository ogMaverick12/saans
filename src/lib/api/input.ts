import type { ZodError } from "zod";

const MAX_FIELD_ERRORS = 5;
const INVALID_JSON_MESSAGE = "Send a valid JSON request body.";

/**
 * Parsed request input ready for schema validation.
 */
export interface InputSuccess {
  ok: true;
  value: unknown;
}

/**
 * Request input that could not be read.
 */
export interface InputFailure {
  ok: false;
  message: string;
}

/**
 * Result of reading a request body or query string.
 */
export type InputResult = InputSuccess | InputFailure;

/**
 * Formats the first few Zod issues as field-level messages.
 */
export function formatIssues(error: ZodError): string {
  return error.issues
    .slice(0, MAX_FIELD_ERRORS)
    .map((issue) => {
      const field = issue.path.join(".");
      return field === "" ? issue.message : `${field}: ${issue.message}`;
    })
    .join("; ");
}

/**
 * Reads query parameters for GET and a JSON body for other methods.
 */
export async function readInput(request: Request): Promise<InputResult> {
  if (request.method === "GET") {
    return {
      ok: true,
      value: Object.fromEntries(new URL(request.url).searchParams),
    };
  }

  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false, message: INVALID_JSON_MESSAGE };
  }
}
