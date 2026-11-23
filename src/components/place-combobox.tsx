"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationOptions } from "@/components/location-options";
import type { PlaceComboboxController } from "@/hooks/use-place-combobox";
import { placeResultAnnouncement } from "@/lib/place-search";

const NO_RESULTS_MESSAGE = "No places found. Try a nearby city or district.";
const SEARCH_HINT =
  "Type at least 2 characters, then use the arrow keys to choose a place.";

/**
 * Renders the labelled combobox input and its result list.
 */
export function PlaceCombobox(controller: PlaceComboboxController) {
  const {
    inputId,
    listboxId,
    hintId,
    errorId,
    query,
    showList,
    activeIndex,
    activeOptionId,
    results,
    status,
    error,
    handleChange,
    handleKeyDown,
    handleFocus,
    handleBlur,
    selectMatch,
  } = controller;
  const announcement = placeResultAnnouncement(status, results.length);
  const describedBy = status === "error" ? `${hintId} ${errorId}` : hintId;

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>Where do you live?</Label>
      <div className="relative" onBlur={handleBlur}>
        <Input
          id={inputId}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-describedby={describedBy}
          aria-invalid={status === "error" ? true : undefined}
          autoComplete="off"
          placeholder="Start typing a city or district"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="h-11"
        />
        <LocationOptions
          id={listboxId}
          matches={results}
          activeIndex={activeIndex}
          open={showList}
          onSelect={selectMatch}
        />
      </div>
      <p id={hintId} className="text-sm text-muted-foreground">
        {SEARCH_HINT}
      </p>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {status === "error" && error !== null && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {showList && status === "success" && results.length === 0 && (
        <p className="text-sm text-muted-foreground">{NO_RESULTS_MESSAGE}</p>
      )}
    </div>
  );
}
