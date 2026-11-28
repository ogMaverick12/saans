import { z } from "zod";
import { LLM_TIMEOUT_MS } from "@/lib/config";
import { AppError } from "@/lib/errors";
import { safeFetch, type FetchLike } from "@/lib/security/safe-fetch";
import {
  LLM_TEMPERATURE,
  type LlmClient,
  type LlmRequest,
} from "@/lib/llm/client";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const JSON_MIME_TYPE = "application/json";
const JSON_RESPONSE_FORMAT = { type: "json_object" } as const;
const BAD_RESPONSE_MESSAGE =
  "The language model returned an unexpected response.";

const openRouterResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string() }),
      }),
    )
    .min(1),
});

export interface OpenRouterClientOptions {
  apiKey: string;
  model: string;
  fetchImpl?: FetchLike;
}

/**
 * Builds the chat-completions request body for one prompt.
 */
function buildOpenRouterBody(model: string, request: LlmRequest) {
  return {
    model,
    messages: [
      { role: "system", content: request.system },
      { role: "user", content: request.user },
    ],
    response_format: JSON_RESPONSE_FORMAT,
    max_tokens: request.maxOutputTokens,
    temperature: LLM_TEMPERATURE,
  };
}

/**
 * Reads the JSON body, mapping a malformed body to a safe upstream error.
 */
async function readPayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AppError("UPSTREAM_FAILED", BAD_RESPONSE_MESSAGE);
  }
}

/**
 * Extracts the first choice content from a validated OpenRouter response.
 */
function readChoiceContent(payload: unknown): string | null {
  const parsed = openRouterResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return null;
  }
  return parsed.data.choices[0]?.message.content ?? null;
}

/**
 * Creates an OpenRouter client that returns raw JSON text.
 */
export function createOpenRouterClient({
  apiKey,
  model,
  fetchImpl = fetch,
}: OpenRouterClientOptions): LlmClient {
  return {
    async complete(request) {
      const response = await safeFetch(
        OPENROUTER_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": JSON_MIME_TYPE,
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(buildOpenRouterBody(model, request)),
        },
        { timeoutMs: LLM_TIMEOUT_MS, fetchImpl },
      );
      const text = readChoiceContent(await readPayload(response));
      if (text === null) {
        throw new AppError("UPSTREAM_FAILED", BAD_RESPONSE_MESSAGE);
      }
      return text;
    },
  };
}
