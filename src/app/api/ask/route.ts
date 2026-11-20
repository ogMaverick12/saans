import { getAirDigest } from "@/lib/air/get-digest";
import { withApiGuard } from "@/lib/api/guard";
import { toGeocodeMatch } from "@/lib/api/place";
import { apiRateLimiter } from "@/lib/api/rate-limit";
import { AskRequestSchema, type AskRequest } from "@/lib/api/schemas";
import { getLlmEnv } from "@/lib/config";
import { createLlmClient } from "@/lib/llm/factory";
import { answerQuestion } from "@/lib/llm/plan";
import type { Ask } from "@/lib/llm/plan-schema";

/**
 * Answers one follow-up question about an existing plan.
 */
async function handleAsk(request: AskRequest): Promise<Ask> {
  const digest = await getAirDigest(toGeocodeMatch(request.place));
  const client = createLlmClient(getLlmEnv());
  return answerQuestion({
    client,
    question: request.question,
    digest,
    plan: request.plan,
    language: request.language,
  });
}

/**
 * POST /api/ask
 */
export const POST = withApiGuard({
  schema: AskRequestSchema,
  handler: handleAsk,
  rateLimiter: apiRateLimiter,
});
