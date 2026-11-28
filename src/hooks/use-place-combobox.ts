import {
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { createComboboxHandlers } from "@/hooks/combobox-handlers";
import { useComboboxIds } from "@/hooks/use-combobox-ids";
import { usePlaceSearch } from "@/hooks/use-place-search";
import type { ClientGeocodeMatch } from "@/lib/client/client-schemas";
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
 * Searches for places and derives the visible list and active option.
 */
function useComboboxView(
  listboxId: string,
  query: string,
  open: boolean,
  activeIndex: number,
) {
  const { status, results, error } = usePlaceSearch(query, open);
  const showList = open && query.trim().length >= MIN_PLACE_QUERY_CHARS;
  const activeMatch = activeIndex >= 0 ? results[activeIndex] : undefined;
  const activeOptionId =
    showList && activeMatch !== undefined
      ? locationOptionId(listboxId, activeIndex)
      : undefined;
  return { status, results, error, showList, activeMatch, activeOptionId };
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
  const ids = useComboboxIds();
  const { status, results, error, showList, activeMatch, activeOptionId } =
    useComboboxView(ids.listboxId, query, open, activeIndex);
  const handlers = createComboboxHandlers({
    onSelect,
    results,
    activeMatch,
    setQuery,
    setOpen,
    setActiveIndex,
  });

  return {
    ...ids,
    query,
    showList,
    activeIndex,
    activeOptionId,
    results,
    status,
    error,
    ...handlers,
  };
}
