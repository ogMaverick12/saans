import type { LlmEnv } from "@/lib/config";
import { AppError } from "@/lib/errors";
import type { FetchLike } from "@/lib/security/safe-fetch";
import type { LlmClient, LlmRequest } from "@/lib/llm/client";
import { createGeminiClient } from "@/lib/llm/gemini";
import { createOpenRouterClient } from "@/lib/llm/openrouter";

const UNAVAILABLE_MESSAGE =
  "The language model is unavailable right now. Please try again.";

/**
 * Tries each provider in order and fails only when every provider fails.
 */
export class FallbackLlmClient implements LlmClient {
  private readonly clients: readonly LlmClient[];

  /**
   * Stores the clients in the order they should be tried.
   */
  constructor(clients: readonly LlmClient[]) {
    this.clients = clients;
  }

  /**
   * Returns the first successful reply, moving on after any provider error.
   */
  async complete(request: LlmRequest): Promise<string> {
    for (const client of this.clients) {
      try {
        return await client.complete(request);
      } catch {
        continue;
      }
    }
    throw new AppError("LLM_UNAVAILABLE", UNAVAILABLE_MESSAGE);
  }
}

/**
 * Builds the ordered Gemini primary, Gemini fallback and OpenRouter client.
 */
export function createLlmClient(
  env: LlmEnv,
  fetchImpl: FetchLike = fetch,
): LlmClient {
  const clients: LlmClient[] = [];

  if (env.geminiApiKey !== null) {
    clients.push(
      createGeminiClient({
        apiKey: env.geminiApiKey,
        model: env.geminiModel,
        fetchImpl,
      }),
      createGeminiClient({
        apiKey: env.geminiApiKey,
        model: env.geminiFallbackModel,
        fetchImpl,
      }),
    );
  }

  if (env.openRouterApiKey !== null && env.openRouterModel !== null) {
    clients.push(
      createOpenRouterClient({
        apiKey: env.openRouterApiKey,
        model: env.openRouterModel,
        fetchImpl,
      }),
    );
  }

  return new FallbackLlmClient(clients);
}
