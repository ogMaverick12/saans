import type { HouseholdMember } from "@/lib/profile/schema";
import type { ProfileOption } from "@/lib/profile/form";

/**
 * Props for the household checkbox group.
 */
export interface CheckboxFieldsetProps {
  id: string;
  legend: string;
  hint: string;
  selected: HouseholdMember[];
  options: readonly ProfileOption<HouseholdMember>[];
  onChange: (selected: HouseholdMember[]) => void;
  error?: string;
}

/**
 * Renders the household member checkboxes.
 */
export function CheckboxFieldset({
  id,
  legend,
  hint,
  selected,
  options,
  onChange,
  error,
}: CheckboxFieldsetProps) {
  const errorId = `${id}-error`;

  function toggle(value: HouseholdMember) {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }
    onChange([...selected, value]);
  }

  return (
    <fieldset
      id={id}
      className="space-y-3"
      aria-describedby={error === undefined ? undefined : errorId}
    >
      <legend className="text-sm font-medium">{legend}</legend>
      <p className="text-sm text-muted-foreground">{hint}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 hover:bg-muted/50"
            >
              <input
                id={optionId}
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => toggle(option.value)}
                aria-invalid={error === undefined ? undefined : true}
                aria-describedby={error === undefined ? undefined : errorId}
                className="size-4 accent-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      {error !== undefined && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
