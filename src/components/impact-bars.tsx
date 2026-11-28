import { PM25_UNIT } from "@/lib/air/format";
import type { ExposureEstimate } from "@/lib/impact/estimate";

const PERCENT_MAX = 100;
const PERCENT_MIN = 0;

export interface ImpactBarsProps {
  estimate: ExposureEstimate;
}

/**
 * Converts a PM2.5 value into a bar width relative to the baseline.
 */
function widthPct(value: number, baseline: number): number {
  if (baseline <= 0) {
    return PERCENT_MIN;
  }
  const share = (value / baseline) * PERCENT_MAX;
  return Math.min(PERCENT_MAX, Math.max(PERCENT_MIN, share));
}

/**
 * Formats a PM2.5 estimate with its unit.
 */
function formatPm25(value: number): string {
  return `${value.toFixed(1)} ${PM25_UNIT}`;
}

/**
 * Renders one labelled horizontal exposure bar.
 */
function ImpactBar({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: number;
  width: number;
  tone: "baseline" | "adjusted";
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm">{formatPm25(value)}</span>
      </div>
      <div
        aria-hidden="true"
        className="h-3 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={
            tone === "baseline"
              ? "h-full rounded-full bg-foreground/30"
              : "h-full rounded-full bg-primary"
          }
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Shows baseline and adjusted daily PM2.5 exposure as labelled horizontal bars.
 */
export function ImpactBars({ estimate }: ImpactBarsProps) {
  return (
    <div className="space-y-4">
      <ImpactBar
        label="Baseline"
        value={estimate.baselineUgM3}
        width={widthPct(estimate.baselineUgM3, estimate.baselineUgM3)}
        tone="baseline"
      />
      <ImpactBar
        label="With these choices"
        value={estimate.adjustedUgM3}
        width={widthPct(estimate.adjustedUgM3, estimate.baselineUgM3)}
        tone="adjusted"
      />
    </div>
  );
}
