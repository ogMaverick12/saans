import type { GeocodeMatch } from "@/lib/air/schemas";
import type { PlaceInput } from "@/lib/api/schemas";

/**
 * Converts a validated request place into the shape used by air lookups.
 */
export function toGeocodeMatch(place: PlaceInput): GeocodeMatch {
  return {
    name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    countryCode: place.countryCode,
    country: null,
    admin1: null,
  };
}
