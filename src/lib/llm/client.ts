/**
 * One request for a JSON reply from a language model.
 */
export interface LlmRequest {
  system: string;
  user: string;
  maxOutputTokens: number;
}

/**
 * Provider-agnostic language model that returns raw JSON text.
 */
export interface LlmClient {
  /**
   * Sends one prompt and resolves with the reply text.
   */
  complete(request: LlmRequest): Promise<string>;
}

/**
 * Sampling temperature shared by every provider for structured JSON replies.
 */
export const LLM_TEMPERATURE = 0.4;
