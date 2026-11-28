"use client";

import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";
import type { PlaceInput } from "@/lib/api/schemas";

export interface LocationButtonProps {
  onLocated: (place: PlaceInput) => void;
}

/**
 * Requests the browser location only when the button is clicked.
 */
export function LocationButton({ onLocated }: LocationButtonProps) {
  const { locating, error, locate } = useGeolocation(onLocated);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="min-h-11"
        onClick={locate}
        disabled={locating}
      >
        {locating ? "Finding your location…" : "Use my location"}
      </Button>
      {error !== null && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
