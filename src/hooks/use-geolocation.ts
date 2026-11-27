import { useCallback, useState } from "react";
import type { PlaceInput } from "@/lib/api/schemas";
import { COORDINATE_DECIMALS } from "@/lib/config";

const PERMISSION_DENIED_CODE = 1;
const POSITION_UNAVAILABLE_CODE = 2;
const TIMEOUT_CODE = 3;
const GEOLOCATION_TIMEOUT_MS = 10_000;
const GEOLOCATION_MAX_AGE_MS = 300_000;

const UNSUPPORTED_MESSAGE =
  "Location is not available in this browser. Search for a city instead.";
const DENIED_MESSAGE =
  "Location permission was denied. Search for a city instead.";
const UNAVAILABLE_MESSAGE =
  "Your location could not be determined. Search for a city instead.";
const TIMEOUT_MESSAGE = "Location lookup timed out. Search for a city instead.";

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: GEOLOCATION_MAX_AGE_MS,
  timeout: GEOLOCATION_TIMEOUT_MS,
};

/**
 * The state of a one-shot geolocation request.
 */
export interface GeolocationState {
  locating: boolean;
  error: string | null;
}

/**
 * Rounds a coordinate to the precision sent to the API.
 */
function roundCoordinate(value: number): number {
  const factor = 10 ** COORDINATE_DECIMALS;
  return Math.round(value * factor) / factor;
}

/**
 * Maps a geolocation failure to a clear message.
 */
function messageForError(error: GeolocationPositionError): string {
  if (error.code === PERMISSION_DENIED_CODE) {
    return DENIED_MESSAGE;
  }
  if (error.code === POSITION_UNAVAILABLE_CODE) {
    return UNAVAILABLE_MESSAGE;
  }
  if (error.code === TIMEOUT_CODE) {
    return TIMEOUT_MESSAGE;
  }
  return UNAVAILABLE_MESSAGE;
}

/**
 * Converts a browser position into the place sent to the API.
 */
function positionToPlace(position: GeolocationPosition): PlaceInput {
  return {
    name: "Your location",
    latitude: roundCoordinate(position.coords.latitude),
    longitude: roundCoordinate(position.coords.longitude),
    countryCode: null,
  };
}

/**
 * Requests the browser location only when the caller asks for it.
 */
export function useGeolocation(onLocated: (place: PlaceInput) => void) {
  const [state, setState] = useState<GeolocationState>({
    locating: false,
    error: null,
  });

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ locating: false, error: UNSUPPORTED_MESSAGE });
      return;
    }

    setState({ locating: true, error: null });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({ locating: false, error: null });
        onLocated(positionToPlace(position));
      },
      (error) => {
        setState({ locating: false, error: messageForError(error) });
      },
      GEOLOCATION_OPTIONS,
    );
  }, [onLocated]);

  return { ...state, locate };
}
