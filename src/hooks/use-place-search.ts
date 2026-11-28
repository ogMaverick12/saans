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
 * Searches for a query and stores the result unless the request was aborted.
 */
function searchQuery(
  query: string,
  signal: AbortSignal,
  setResult: (state: SearchResultState) => void,
): void {
  searchPlaces(query, { signal })
    .then((results) => {
      if (!signal.aborted) {
        setResult({ query, results, error: null });
      }
    })
    .catch((error: unknown) => {
      if (signal.aborted || isAbortError(error)) {
        return;
      }
      setResult({ query, results: [], error: toClientMessage(error) });
    });
}

/**
 * Maps the stored result to the state shown by the combobox.
 */
function toPlaceSearchState(
  active: boolean,
  query: string,
  result: SearchResultState | null,
): PlaceSearchState {
  if (!active) {
    return INITIAL_PLACE_SEARCH_STATE;
  }
  if (result === null || result.query !== query) {
    return { status: "loading", results: [], error: null };
  }
  if (result.error !== null) {
    return { status: "error", results: [], error: result.error };
  }
  return { status: "success", results: result.results, error: null };
}

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
    searchQuery(debounced, controller.signal, setResult);

    return () => controller.abort();
  }, [active, debounced]);

  return toPlaceSearchState(active, debounced, result);
}
