import { useCallback, useRef, type Dispatch } from "react";
import {
  fetchAirDigest,
  isAbortError,
  toClientMessage,
} from "@/lib/api/client";
import type { PlaceInput } from "@/lib/api/schemas";
import type { PlanFlowAction } from "@/lib/plan-flow";

/**
 * Loads air for a place and cancels any request already in flight.
 */
export interface AirLoader {
  loadAir: (place: PlaceInput) => void;
  cancelAir: () => void;
}

/**
 * Fetches the air digest for a place, ignoring stale and aborted responses.
 */
export function useAirLoader(dispatch: Dispatch<PlanFlowAction>): AirLoader {
  const requestId = useRef(0);
  const abort = useRef<AbortController | null>(null);

  const loadAir = useCallback(
    (place: PlaceInput) => {
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      const currentRequest = ++requestId.current;
      dispatch({ type: "AIR_LOADING" });
      fetchAirDigest(place, { signal: controller.signal })
        .then((air) => {
          if (currentRequest === requestId.current) {
            dispatch({ type: "AIR_READY", air });
          }
        })
        .catch((error: unknown) => {
          if (currentRequest !== requestId.current || isAbortError(error)) {
            return;
          }
          dispatch({
            type: "FAILED",
            source: "air",
            message: toClientMessage(error),
          });
        });
    },
    [dispatch],
  );

  const cancelAir = useCallback(() => {
    abort.current?.abort();
    requestId.current += 1;
  }, []);

  return { loadAir, cancelAir };
}
