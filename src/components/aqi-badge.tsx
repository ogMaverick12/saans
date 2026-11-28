import {
  CircleAlert,
  CircleCheck,
  CircleX,
  OctagonAlert,
  ShieldAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import type { AqiCategory, AqiLevel } from "@/lib/air/aqi-scales";
import { AQI_BADGE_CLASSES } from "@/components/aqi-styles";

const AQI_ICONS: Readonly<Record<AqiLevel, LucideIcon>> = {
  0: CircleCheck,
  1: CircleAlert,
  2: TriangleAlert,
  3: OctagonAlert,
  4: CircleX,
  5: ShieldAlert,
};

export interface AqiBadgeProps {
  category: AqiCategory;
}

/**
 * Shows an AQI category as a coloured badge with a distinct icon and label.
 */
export function AqiBadge({ category }: AqiBadgeProps) {
  const Icon = AQI_ICONS[category.level];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium",
        AQI_BADGE_CLASSES[category.level],
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {category.label}
    </span>
  );
}
