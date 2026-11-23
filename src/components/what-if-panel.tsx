"use client";

import { useMemo, useState } from "react";
import { ImpactBars } from "@/components/impact-bars";
import { WhatIfGroups } from "@/components/what-if-groups";
import { WhatIfTrips } from "@/components/what-if-trips";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { ClientAirDigest } from "@/lib/api/client-schemas";
import type { ClientPlanWithImpact } from "@/lib/api/client-plan-schemas";
import { WHAT_IF_ANNOUNCE_DELAY_MS } from "@/lib/config";
import { estimateExposure, type ExposureEstimate } from "@/lib/impact/estimate";
import { collectTripFactors } from "@/lib/impact/plan-factors";
import {
  hasDuplicateExposureGroups,
  initialExposureSelection,
} from "@/lib/impact/what-if";
import type { Profile } from "@/lib/profile/schema";

const CAVEAT =
  "Estimate for today's forecast and your household. Real results depend on fit, room size and habits.";
const DEDUPE_NOTE = "Counts once, with the stronger choice.";

/**
 * Props for the in-browser exposure simulator.
 */
export interface WhatIfPanelProps {
  digest: ClientAirDigest;
  profile: Profile;
  plan: ClientPlanWithImpact;
}

/**
 * Builds the plain reduction sentence for the current estimate.
 */
function reductionSentence(reductionPct: number): string {
  if (reductionPct <= 0) {
    return "These choices do not lower your estimated exposure yet.";
  }
  return `These choices could cut your average daily exposure by about ${reductionPct}%.`;
}

/**
 * Builds the debounced polite announcement for a new estimate.
 */
function announcementFor(
  estimate: ExposureEstimate,
  duplicates: boolean,
): string {
  const change =
    estimate.reductionPct > 0
      ? `${estimate.reductionPct} percent lower than the baseline of ${estimate.baselineUgM3}`
      : `unchanged from the baseline of ${estimate.baselineUgM3}`;
  const dedupe = duplicates ? ` ${DEDUPE_NOTE}` : "";
  return `Exposure estimate updated: about ${estimate.adjustedUgM3} micrograms per cubic metre, ${change}.${dedupe}`;
}

/**
 * Lets the household toggle exposure factors and see the estimate change instantly.
 */
export function WhatIfPanel({ digest, profile, plan }: WhatIfPanelProps) {
  const [selected, setSelected] = useState(() =>
    initialExposureSelection(plan),
  );
  const [hasChanged, setHasChanged] = useState(false);
  const estimate = useMemo(
    () => estimateExposure(digest, profile, selected),
    [digest, profile, selected],
  );
  const announced = useDebouncedValue(estimate, WHAT_IF_ANNOUNCE_DELAY_MS);
  const duplicates = hasDuplicateExposureGroups(selected);
  const tripFactors = useMemo(() => collectTripFactors(plan), [plan]);

  function toggle(id: string, checked: boolean) {
    setSelected((current) => {
      if (!checked) {
        return current.filter((item) => item !== id);
      }
      return current.includes(id) ? current : [...current, id];
    });
    setHasChanged(true);
  }

  return (
    <section aria-labelledby="impact-heading" className="space-y-4">
      <h2 id="impact-heading" className="text-xl font-semibold tracking-tight">
        Your impact
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <WhatIfGroups selected={selected} onToggle={toggle} />
        <div className="space-y-4">
          <ImpactBars estimate={estimate} />
          <p className="text-sm">{reductionSentence(estimate.reductionPct)}</p>
          {duplicates && (
            <p className="rounded-md border border-border bg-muted/50 p-3 text-sm">
              {DEDUPE_NOTE}
            </p>
          )}
          <WhatIfTrips factors={tripFactors} />
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {hasChanged ? announcementFor(announced, duplicates) : ""}
      </p>
      <p className="text-sm text-muted-foreground">{CAVEAT}</p>
    </section>
  );
}
