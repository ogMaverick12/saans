import type { ZodError, ZodType } from "zod";
import { LLM_TIMEOUT_MS } from "@/lib/config";
import { AppError } from "@/lib/errors";
import type { LlmClient, LlmRequest } from "@/lib/llm/client";

const BAD_OUTPUT_MESSAGE =
  "The language model returned an invalid response. Please try again.";
const TIMEOUT_MESSAGE =
  "The language model took too long to respond. Please try again.";
const INVALID_JSON_SUMMARY = "The reply was not valid JSON.";
const MAX_VALIDATION_LINES = 8;

/**
 * One schema-backed generation request.
 */
export interface StructuredRequestOptions<T> {
  client: LlmClient;
  schema: ZodType<T>;
  prompt: { system: string; user: string };
  maxOutputTokens: number;
}

interface ParseSuccess<T> {
  ok: true;
  value: T;
}

interface ParseFailure {
  ok: false;
  summary: string;
}

/**
 * Summarises schema issues without echoing the model's raw reply.
 */
function validationSummary(error: ZodError): string {
  return error.issues
    .slice(0, MAX_VALIDATION_LINES)
    .map((issue) => {
      const path = issue.path.join(".");
      return path === "" ? issue.message : `${path}: ${issue.message}`;
    })
    .join("; ");
}

/**
 * Parses one raw reply and either returns the value or a safe error summary.
 */
function parseReply<T>(
  raw: string,
  schema: ZodType<T>,
): ParseSuccess<T> | ParseFailure {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { ok: false, summary: INVALID_JSON_SUMMARY };
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, summary: validationSummary(parsed.error) };
  }
  return { ok: true, value: parsed.data };
}

/**
 * Calls the model once and fails with LLM_UNAVAILABLE after LLM_TIMEOUT_MS.
 */
async function completeWithinTimeout(
  client: LlmClient,
  request: LlmRequest,
): Promise<string> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new AppError("LLM_UNAVAILABLE", TIMEOUT_MESSAGE)),
      LLM_TIMEOUT_MS,
    );
  });
  try {
    return await Promise.race([client.complete(request), timeout]);
  } finally {
    if (timer !== null) {
      clearTimeout(timer);
    }
  }
}

/**
 * Generates schema-valid JSON, retrying once with the validation summary.
 */
export async function generateStructured<T>({
  client,
  schema,
  prompt,
  maxOutputTokens,
}: StructuredRequestOptions<T>): Promise<T> {
  const request = {
    system: prompt.system,
    user: prompt.user,
    maxOutputTokens,
  };
  const first = parseReply(
    await completeWithinTimeout(client, request),
    schema,
  );
  if (first.ok) {
    return first.value;
  }

  const retryUser = `${prompt.user}\n\nYour previous reply failed validation: ${first.summary}\nReturn corrected JSON only.`;
  const second = parseReply(
    await completeWithinTimeout(client, { ...request, user: retryUser }),
    schema,
  );
  if (second.ok) {
    return second.value;
  }
  throw new AppError("LLM_BAD_OUTPUT", BAD_OUTPUT_MESSAGE);
}
