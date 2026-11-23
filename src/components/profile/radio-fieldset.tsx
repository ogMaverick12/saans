import { cn } from "@/lib/utils";
import type { ProfileOption } from "@/lib/profile/form";

/**
 * Props for a fieldset of radio choices.
 */
export interface RadioFieldsetProps<T extends string> {
  id: string;
  name: string;
  legend: string;
  value: T | "";
  options: readonly ProfileOption<T>[];
  onChange: (value: T) => void;
  error?: string;
  hint?: string;
}

/**
 * Renders a labelled radio group with an inline error.
 */
export function RadioFieldset<T extends string>({
  id,
  name,
  legend,
  value,
  options,
  onChange,
  error,
  hint,
}: RadioFieldsetProps<T>) {
  const errorId = `${id}-error`;

  return (
    <fieldset
      id={id}
      className="space-y-3"
      aria-describedby={error === undefined ? undefined : errorId}
    >
      <legend className="text-sm font-medium">{legend}</legend>
      {hint !== undefined && (
        <p className="text-sm text-muted-foreground">{hint}</p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm transition-colors",
                "has-[:checked]:border-primary has-[:checked]:bg-primary/5",
                "hover:bg-muted/50",
              )}
            >
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
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
