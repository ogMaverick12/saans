import type {
  ChangeEvent,
  Dispatch,
  FocusEvent,
  KeyboardEvent,
  SetStateAction,
} from "react";
import type { ClientGeocodeMatch } from "@/lib/client/client-schemas";
import type { PlaceInput } from "@/lib/api/schemas";

/** State setters and callbacks shared by the combobox handlers. */
export interface ComboboxHandlerOptions {
  onSelect: (place: PlaceInput) => void;
  results: ClientGeocodeMatch[];
  activeMatch: ClientGeocodeMatch | undefined;
  setQuery: Dispatch<SetStateAction<string>>;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setActiveIndex: Dispatch<SetStateAction<number>>;
}

/** Handlers returned to the combobox component. */
export interface ComboboxHandlers {
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  handleFocus: () => void;
  handleBlur: (event: FocusEvent<HTMLDivElement>) => void;
  selectMatch: (match: ClientGeocodeMatch) => void;
  selectPlace: (place: PlaceInput) => void;
}

function selectPlace(options: ComboboxHandlerOptions, place: PlaceInput): void {
  options.onSelect(place);
  options.setQuery(place.name);
  options.setOpen(false);
  options.setActiveIndex(-1);
}

function selectMatch(
  options: ComboboxHandlerOptions,
  match: ClientGeocodeMatch,
): void {
  selectPlace(options, {
    name: match.name,
    latitude: match.latitude,
    longitude: match.longitude,
    countryCode: match.countryCode,
  });
}

function changeQuery(
  options: ComboboxHandlerOptions,
  event: ChangeEvent<HTMLInputElement>,
): void {
  options.setQuery(event.target.value);
  options.setOpen(true);
  options.setActiveIndex(-1);
}

function handleArrowDown(
  options: ComboboxHandlerOptions,
  event: KeyboardEvent<HTMLInputElement>,
): void {
  event.preventDefault();
  options.setOpen(true);
  options.setActiveIndex((index) =>
    Math.min(index + 1, options.results.length - 1),
  );
}

function handleArrowUp(
  options: ComboboxHandlerOptions,
  event: KeyboardEvent<HTMLInputElement>,
): void {
  event.preventDefault();
  options.setActiveIndex((index) => Math.max(index - 1, 0));
}

function handleEnter(
  options: ComboboxHandlerOptions,
  event: KeyboardEvent<HTMLInputElement>,
): void {
  if (options.activeMatch === undefined) {
    return;
  }
  event.preventDefault();
  selectMatch(options, options.activeMatch);
}

function handleEscape(
  options: ComboboxHandlerOptions,
  event: KeyboardEvent<HTMLInputElement>,
): void {
  event.preventDefault();
  options.setOpen(false);
  options.setActiveIndex(-1);
}

type KeyHandler = (
  options: ComboboxHandlerOptions,
  event: KeyboardEvent<HTMLInputElement>,
) => void;

const KEY_HANDLERS: Readonly<Record<string, KeyHandler>> = {
  ArrowDown: handleArrowDown,
  ArrowUp: handleArrowUp,
  Enter: handleEnter,
  Escape: handleEscape,
};

function handleKeyDown(
  options: ComboboxHandlerOptions,
  event: KeyboardEvent<HTMLInputElement>,
): void {
  const handler = KEY_HANDLERS[event.key];
  if (handler !== undefined) {
    handler(options, event);
  }
}

function blurCombobox(
  options: ComboboxHandlerOptions,
  event: FocusEvent<HTMLDivElement>,
): void {
  const next = event.relatedTarget;
  if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
    options.setOpen(false);
    options.setActiveIndex(-1);
  }
}

function focusCombobox(options: ComboboxHandlerOptions): void {
  options.setOpen(true);
}

/** Builds the event handlers for the place combobox. */
export function createComboboxHandlers(
  options: ComboboxHandlerOptions,
): ComboboxHandlers {
  return {
    handleChange: (event) => changeQuery(options, event),
    handleKeyDown: (event) => handleKeyDown(options, event),
    handleFocus: () => focusCombobox(options),
    handleBlur: (event) => blurCombobox(options, event),
    selectMatch: (match) => selectMatch(options, match),
    selectPlace: (place) => selectPlace(options, place),
  };
}
