import {
  useId,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { usePlaceSearch } from "@/hooks/use-place-search";
import type { ClientGeocodeMatch } from "@/lib/api/client-schemas";
import type { PlaceInput } from "@/lib/api/schemas";
import {
  locationOptionId,
  MIN_PLACE_QUERY_CHARS,
  type PlaceSearchStatus,
} from "@/lib/place-search";

/**
 * State and handlers shared by the place combobox and its container.
 */
export interface PlaceComboboxController {
  inputId: string;
  listboxId: string;
  hintId: string;
  errorId: string;
  query: string;
  showList: boolean;
  activeIndex: number;
  activeOptionId: string | undefined;
  results: ClientGeocodeMatch[];
  status: PlaceSearchStatus;
  error: string | null;
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  handleFocus: () => void;
  handleBlur: (event: FocusEvent<HTMLDivElement>) => void;
  selectMatch: (match: ClientGeocodeMatch) => void;
  selectPlace: (place: PlaceInput) => void;
}

/**
 * Owns the combobox state and keyboard behaviour for place search.
 */
export function usePlaceCombobox(
  onSelect: (place: PlaceInput) => void,
): PlaceComboboxController {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputId = useId();
  const listboxId = useId();
  const hintId = useId();
  const errorId = useId();
  const { status, results, error } = usePlaceSearch(query, open);
  const showList = open && query.trim().length >= MIN_PLACE_QUERY_CHARS;
  const activeMatch = activeIndex >= 0 ? results[activeIndex] : undefined;
  const activeOptionId =
    showList && activeMatch !== undefined
      ? locationOptionId(listboxId, activeIndex)
      : undefined;

  function selectPlace(place: PlaceInput) {
    onSelect(place);
    setQuery(place.name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function selectMatch(match: ClientGeocodeMatch) {
    selectPlace({
      name: match.name,
      latitude: match.latitude,
      longitude: match.longitude,
      countryCode: match.countryCode,
    });
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
    setOpen(true);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter" && activeMatch !== undefined) {
      event.preventDefault();
      selectMatch(activeMatch);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleFocus() {
    setOpen(true);
  }

  return {
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
    selectPlace,
  };
}
