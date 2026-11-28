import { SelectField } from "@/components/profile/select-field";
import { SwitchField } from "@/components/profile/switch-field";
import { HOME_TYPE_OPTIONS } from "@/lib/profile/form";
import type { HomeType } from "@/lib/profile/schema";

export interface HomeFieldsetProps {
  homeType: HomeType | "";
  hasPurifier: boolean;
  hasAirConditioner: boolean;
  onHomeTypeChange: (value: HomeType) => void;
  onPurifierChange: (checked: boolean) => void;
  onAirConditionerChange: (checked: boolean) => void;
  error?: string;
}

/**
 * Renders home type, purifier and air-conditioner answers.
 */
export function HomeFieldset({
  homeType,
  hasPurifier,
  hasAirConditioner,
  onHomeTypeChange,
  onPurifierChange,
  onAirConditionerChange,
  error,
}: HomeFieldsetProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium">Your home</legend>
      <SelectField
        id="profile-homeType"
        label="Home type"
        value={homeType}
        options={HOME_TYPE_OPTIONS}
        onChange={onHomeTypeChange}
        error={error}
      />
      <SwitchField
        id="profile-purifier"
        label="We have an air purifier"
        checked={hasPurifier}
        onChange={onPurifierChange}
      />
      <SwitchField
        id="profile-air-conditioner"
        label="We have an air conditioner"
        checked={hasAirConditioner}
        onChange={onAirConditionerChange}
      />
    </fieldset>
  );
}
