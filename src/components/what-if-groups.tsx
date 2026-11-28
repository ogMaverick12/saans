import { SwitchField } from "@/components/profile/switch-field";
import {
  EXPOSURE_GROUP_ORDER,
  exposureFactorsForGroup,
} from "@/lib/impact/what-if";

export interface WhatIfGroupsProps {
  selected: readonly string[];
  onToggle: (id: string, checked: boolean) => void;
}

/**
 * Renders five labelled switch groups for the exposure factors.
 */
export function WhatIfGroups({ selected, onToggle }: WhatIfGroupsProps) {
  return (
    <div data-print-hide className="space-y-5">
      {EXPOSURE_GROUP_ORDER.map(({ group, legend }) => (
        <fieldset key={group} className="space-y-2">
          <legend className="text-sm font-medium">{legend}</legend>
          {exposureFactorsForGroup(group).map((factor) => (
            <SwitchField
              key={factor.id}
              id={`what-if-${factor.id}`}
              label={factor.label}
              checked={selected.includes(factor.id)}
              onChange={(checked) => onToggle(factor.id, checked)}
            />
          ))}
        </fieldset>
      ))}
    </div>
  );
}
