import { useId } from "react";

/**
 * Stable element ids used by the place combobox.
 */
export interface ComboboxIds {
  inputId: string;
  listboxId: string;
  hintId: string;
  errorId: string;
}

/**
 * Returns stable ids for the combobox input, listbox, hint and error.
 */
export function useComboboxIds(): ComboboxIds {
  return {
    inputId: useId(),
    listboxId: useId(),
    hintId: useId(),
    errorId: useId(),
  };
}
