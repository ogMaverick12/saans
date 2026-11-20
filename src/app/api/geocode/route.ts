import { searchPlaces } from "@/lib/air/clients";
import { withApiGuard } from "@/lib/api/guard";
import { apiRateLimiter } from "@/lib/api/rate-limit";
import { PRIVATE_CACHE_CONTROL } from "@/lib/api/responses";
import { GeocodeQuerySchema, type GeocodeQuery } from "@/lib/api/schemas";

/**
 * Returns up to five matching places for a city search.
 */
function handleGeocode({ q }: GeocodeQuery) {
  return searchPlaces(q);
}

/**
 * GET /api/geocode?q=
 */
export const GET = withApiGuard({
  schema: GeocodeQuerySchema,
  handler: handleGeocode,
  rateLimiter: apiRateLimiter,
  cacheControl: PRIVATE_CACHE_CONTROL,
});
