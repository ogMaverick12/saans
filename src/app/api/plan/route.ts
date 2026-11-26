import { getAirDigest } from "@/lib/air/get-digest";
import { withApiGuard } from "@/lib/api/guard";
import { toGeocodeMatch } from "@/lib/api/place";
import { apiRateLimiter } from "@/lib/api/rate-limit";
import { PlanRequestSchema, type PlanRequest } from "@/lib/api/schemas";
import { getLlmEnv } from "@/lib/config";
import { createLlmClient } from "@/lib/llm/factory";
import { generatePlan, type GeneratedPlan } from "@/lib/llm/plan";

/**
 * Builds a plan with impact estimates and the digest it was based on.
 */
async function handlePlan(request: PlanRequest): Promise<GeneratedPlan> {
  const digest = await getAirDigest(toGeocodeMatch(request.place));
  const client = createLlmClient(getLlmEnv());
  return generatePlan({
    client,
    digest,
    profile: request.profile,
    language: request.language,
    readingMode: request.readingMode,
  });
}

/**
 * Allows the plan call to finish within Vercel's function limit.
 */
export const maxDuration = 60;

/**
 * POST /api/plan
 */
export const POST = withApiGuard({
  schema: PlanRequestSchema,
  handler: handlePlan,
  rateLimiter: apiRateLimiter,
});
