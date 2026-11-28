import { z } from "zod";
import { LLM_TIMEOUT_MS } from "@/lib/config";
import { AppError } from "@/lib/errors";
import { safeFetch, type FetchLike } from "@/lib/security/safe-fetch";
import {
  LLM_TEMPERATURE,
  type LlmClient,
  type LlmRequest,
} from "@/lib/llm/client";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models";
const JSON_MIME_TYPE = "application/json";
const BAD_RESPONSE_MESSAGE =
  "The language model returned an unexpected response.";

const geminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(z.object({ text: z.string() })),
        }),
      }),
    )
    .min(1),
});

export interface GeminiClientOptions {
  apiKey: string;
  model: string;
  fetchImpl?: FetchLike;
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
 * Extracts the first candidate text from a validated Gemini response.
 */
function readCandidateText(payload: unknown): string | null {
  const parsed = geminiResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return null;
  }
  return parsed.data.candidates[0]?.content.parts[0]?.text ?? null;
}

/**
 * Builds the generateContent request body for one prompt.
 */
function buildGeminiBody(request: LlmRequest) {
  return {
    systemInstruction: { parts: [{ text: request.system }] },
    contents: [{ role: "user", parts: [{ text: request.user }] }],
    generationConfig: {
      responseMimeType: JSON_MIME_TYPE,
      maxOutputTokens: request.maxOutputTokens,
      temperature: LLM_TEMPERATURE,
    },
  };
}

/**
 * Creates a Gemini client that returns raw JSON text.
 */
export function createGeminiClient({
  apiKey,
  model,
  fetchImpl = fetch,
}: GeminiClientOptions): LlmClient {
  return {
    async complete(request) {
      const response = await safeFetch(
        `${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": JSON_MIME_TYPE,
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(buildGeminiBody(request)),
        },
        { timeoutMs: LLM_TIMEOUT_MS, fetchImpl },
      );
      const text = readCandidateText(await readPayload(response));
      if (text === null) {
        throw new AppError("UPSTREAM_FAILED", BAD_RESPONSE_MESSAGE);
      }
      return text;
    },
  };
}
