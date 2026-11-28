import type { ClientGeocodeMatch } from "@/lib/client/client-schemas";

/**
 * The shortest query the place search accepts.
 */
export const MIN_PLACE_QUERY_CHARS = 2;

/**
 * The states a place search can be in.
 */
export type PlaceSearchStatus = "idle" | "loading" | "success" | "error";

/**
 * Builds the DOM id for one place option.
 */
export function locationOptionId(listboxId: string, index: number): string {
  return `${listboxId}-option-${index}`;
}

/**
 * Joins the region and country shown under a place name.
 */
export function describePlace(match: ClientGeocodeMatch): string {
  return [match.admin1, match.country]
    .filter((part): part is string => part !== null && part !== "")
    .join(", ");
}

/**
 * Builds the polite live-region message for a place search.
 */
export function placeResultAnnouncement(
  status: PlaceSearchStatus,
  count: number,
): string {
  if (status === "success") {
    return `${count} ${count === 1 ? "place" : "places"} found.`;
  }
  if (status === "loading") {
    return "Searching for places.";
  }
  return "";
}
