import type { ChangeEvent } from "react";
import { Label } from "@/components/ui/label";
import type { ProfileOption } from "@/lib/profile/form";

/**
 * Props for a labelled native select.
 */
export interface SelectFieldProps<T extends string> {
  id: string;
  label: string;
  value: T | "";
  options: readonly ProfileOption<T>[];
  onChange: (value: T) => void;
  error?: string;
}

/**
 * Renders a labelled select with a placeholder and an inline error.
 */
export function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  error,
}: SelectFieldProps<T>) {
  const errorId = `${id}-error`;

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = options.find((option) => option.value === event.target.value);
    if (next !== undefined) {
      onChange(next.value);
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={handleChange}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={error === undefined ? undefined : errorId}
        className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
      >
        <option value="" disabled>
          Choose an option
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error !== undefined && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
