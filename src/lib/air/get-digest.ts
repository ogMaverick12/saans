import { analyzeAir } from "@/lib/air/analyze";
import { fetchAirQuality, fetchWeather } from "@/lib/air/clients";
import type { AirDigest, GeocodeMatch } from "@/lib/air/schemas";
import type { FetchLike } from "@/lib/security/safe-fetch";

/**
 * Dependencies for building an air digest; tests inject a fake fetch.
 */
export interface AirDigestDependencies {
  fetchImpl?: FetchLike;
}

/**
 * Fetches air and weather in parallel and analyses them into a digest.
 */
export async function getAirDigest(
  place: GeocodeMatch,
  deps: AirDigestDependencies = {},
): Promise<AirDigest> {
  const [air, weather] = await Promise.all([
    fetchAirQuality(place.latitude, place.longitude, deps.fetchImpl),
    fetchWeather(place.latitude, place.longitude, deps.fetchImpl),
  ]);
  return analyzeAir(air, weather, place);
}
