import { useEffect, useState } from "react";
import {
  isAbortError,
  searchPlaces,
  toClientMessage,
} from "@/lib/client/client";
import type { ClientGeocodeMatch } from "@/lib/client/client-schemas";
import { SEARCH_DEBOUNCE_MS } from "@/lib/config";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  MIN_PLACE_QUERY_CHARS,
  type PlaceSearchStatus,
} from "@/lib/place-search";

/**
 * The state of a debounced place search.
 */
export interface PlaceSearchState {
  status: PlaceSearchStatus;
  results: ClientGeocodeMatch[];
  error: string | null;
}

interface SearchResultState {
  query: string;
  results: ClientGeocodeMatch[];
  error: string | null;
}

const INITIAL_PLACE_SEARCH_STATE: PlaceSearchState = {
  status: "idle",
  results: [],
  error: null,
};

/**
 * Searches for places after a short pause, aborting stale requests.
 */
export function usePlaceSearch(
  query: string,
  enabled: boolean,
): PlaceSearchState {
  const debounced = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const [result, setResult] = useState<SearchResultState | null>(null);
  const active = enabled && debounced.length >= MIN_PLACE_QUERY_CHARS;

  useEffect(() => {
    if (!active) {
      return;
    }

    const controller = new AbortController();
    searchPlaces(debounced, { signal: controller.signal })
      .then((results) => {
        if (!controller.signal.aborted) {
          setResult({ query: debounced, results, error: null });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }
        setResult({
          query: debounced,
          results: [],
          error: toClientMessage(error),
        });
      });

    return () => controller.abort();
  }, [active, debounced]);

  if (!active) {
    return INITIAL_PLACE_SEARCH_STATE;
  }
  if (result === null || result.query !== debounced) {
    return { status: "loading", results: [], error: null };
  }
  if (result.error !== null) {
    return { status: "error", results: [], error: result.error };
  }
  return { status: "success", results: result.results, error: null };
}
