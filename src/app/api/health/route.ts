import { checkHealth, type HealthReport } from "@/lib/api/health";
import { withApiGuard } from "@/lib/api/guard";
import { apiRateLimiter } from "@/lib/api/rate-limit";
import { HealthQuerySchema, type HealthQuery } from "@/lib/api/schemas";

/**
 * Reports LLM configuration and optionally probes each configured client.
 */
function handleHealth({ probe }: HealthQuery): Promise<HealthReport> {
  return checkHealth({ probe: probe === "1" });
}

/**
 * GET /api/health
 */
export const GET = withApiGuard({
  schema: HealthQuerySchema,
  handler: handleHealth,
  rateLimiter: apiRateLimiter,
});
