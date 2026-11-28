import type { ReactNode } from "react";
import type { ProfileOption } from "@/lib/profile/form";
import { cn } from "cn";

interface CommonFieldsetProps<T extends string> {
  id: string;
  legend: string;
  hint?: string;
  options: readonly ProfileOption<T>[];
  error?: string;
}

export type FieldsetGroupProps<T extends string> =
  | (CommonFieldsetProps<T> & {
      type: "checkbox";
      selected: T[];
      onChange: (selected: T[]) => void;
    })
  | (CommonFieldsetProps<T> & {
      type: "radio";
      name: string;
      value: T | "";
      onChange: (value: T) => void;
    });

const OPTION_CLASSES = cn(
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm transition-colors",
  "has-[:checked]:border-primary has-[:checked]:bg-primary/5",
  "hover:bg-muted/50",
);

const INPUT_CLASSES =
  "size-4 accent-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function FieldsetShell({
  id,
  legend,
  hint,
  error,
  children,
}: {
  id: string;
  legend: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
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
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
      {error !== undefined && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function isChecked<T extends string>(
  group: FieldsetGroupProps<T>,
  value: T,
): boolean {
  return group.type === "checkbox"
    ? group.selected.includes(value)
    : group.value === value;
}

function toggleSelection<T extends string>(selected: T[], value: T): T[] {
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

function changeOption<T extends string>(
  group: FieldsetGroupProps<T>,
  value: T,
): void {
  if (group.type === "checkbox") {
    group.onChange(toggleSelection(group.selected, value));
    return;
  }
  group.onChange(value);
}

function FieldsetOption<T extends string>({
  group,
  option,
}: {
  group: FieldsetGroupProps<T>;
  option: ProfileOption<T>;
}) {
  const optionId = `${group.id}-${option.value}`;
  const errorId = `${group.id}-error`;

  return (
    <label htmlFor={optionId} className={OPTION_CLASSES}>
      <input
        id={optionId}
        type={group.type}
        name={group.type === "radio" ? group.name : undefined}
        value={group.type === "radio" ? option.value : undefined}
        checked={isChecked(group, option.value)}
        onChange={() => changeOption(group, option.value)}
        aria-invalid={
          group.type === "checkbox" && group.error !== undefined
            ? true
            : undefined
        }
        aria-describedby={group.error === undefined ? undefined : errorId}
        className={INPUT_CLASSES}
      />
      <span>{option.label}</span>
    </label>
  );
}

/**
 * Renders a labelled group of checkbox or radio options.
 */
export function FieldsetGroup<T extends string>(props: FieldsetGroupProps<T>) {
  return (
    <FieldsetShell
      id={props.id}
      legend={props.legend}
      hint={props.hint}
      error={props.error}
    >
      {props.options.map((option) => (
        <FieldsetOption key={option.value} group={props} option={option} />
      ))}
    </FieldsetShell>
  );
}
