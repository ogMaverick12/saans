"use client";

import { LocationButton } from "@/components/location-button";
import { PlaceCombobox } from "@/components/place-combobox";
import { usePlaceCombobox } from "@/hooks/use-place-combobox";
import type { PlaceInput } from "@/lib/api/schemas";

export interface LocationSearchProps {
  onSelect: (place: PlaceInput) => void;
}

/**
 * Searches for a place by typing or by asking the browser for the location.
 */
export function LocationSearch({ onSelect }: LocationSearchProps) {
  const combobox = usePlaceCombobox(onSelect);

  return (
    <div className="space-y-4">
      <PlaceCombobox controller={combobox} />
      <LocationButton onLocated={combobox.selectPlace} />
    </div>
  );
}
