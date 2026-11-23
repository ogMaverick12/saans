import { cn } from "@/lib/utils";
import type { ClientGeocodeMatch } from "@/lib/api/client-schemas";
import { describePlace, locationOptionId } from "@/lib/place-search";

/**
 * Props for the combobox result list.
 */
export interface LocationOptionsProps {
  id: string;
  matches: ClientGeocodeMatch[];
  activeIndex: number;
  open: boolean;
  onSelect: (match: ClientGeocodeMatch) => void;
}

/**
 * Renders the listbox of place matches for the location combobox.
 */
export function LocationOptions({
  id,
  matches,
  activeIndex,
  open,
  onSelect,
}: LocationOptionsProps) {
  return (
    <ul
      id={id}
      role="listbox"
      aria-label="Place results"
      hidden={!open}
      className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-popover p-1"
    >
      {matches.map((match, index) => {
        const detail = describePlace(match);
        return (
          <li
            key={`${match.name}-${match.latitude}-${match.longitude}`}
            role="none"
          >
            <button
              type="button"
              role="option"
              id={locationOptionId(id, index)}
              aria-selected={index === activeIndex}
              tabIndex={-1}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(match)}
              className={cn(
                "flex min-h-11 w-full flex-col items-start justify-center gap-0.5 rounded-md px-3 py-2 text-left text-sm",
                index === activeIndex && "bg-accent text-accent-foreground",
              )}
            >
              <span className="font-medium">{match.name}</span>
              {detail !== "" && (
                <span className="text-xs text-muted-foreground">{detail}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
