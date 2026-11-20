import { getAirDigest } from "@/lib/air/get-digest";
import type { AirDigest } from "@/lib/air/schemas";
import { withApiGuard } from "@/lib/api/guard";
import { apiRateLimiter } from "@/lib/api/rate-limit";
import { PRIVATE_CACHE_CONTROL } from "@/lib/api/responses";
import { AirQuerySchema, type AirQuery } from "@/lib/api/schemas";

/**
 * Fetches and analyses today's air for the requested coordinates.
 */
function handleAir(query: AirQuery): Promise<AirDigest> {
  return getAirDigest({
    name: query.name,
    latitude: query.lat,
    longitude: query.lon,
    countryCode: null,
    country: query.country ?? null,
    admin1: null,
  });
}

/**
 * GET /api/air?lat=&lon=
 */
export const GET = withApiGuard({
  schema: AirQuerySchema,
  handler: handleAir,
  rateLimiter: apiRateLimiter,
  cacheControl: PRIVATE_CACHE_CONTROL,
});
