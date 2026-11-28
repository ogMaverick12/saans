import { Switch } from "@/components/ui/switch";

export interface SwitchFieldProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Renders a switch with a visible label and optional description.
 */
export function SwitchField({
  id,
  label,
  description,
  checked,
  onChange,
}: SwitchFieldProps) {
  const descriptionId = `${id}-description`;

  return (
    <div className="flex min-h-11 items-center justify-between gap-4">
      <div className="space-y-1">
        <p id={`${id}-label`} className="text-sm font-medium">
          {label}
        </p>
        {description !== undefined && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-labelledby={`${id}-label`}
        aria-describedby={description === undefined ? undefined : descriptionId}
      />
    </div>
  );
}
