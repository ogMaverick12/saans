import { cn } from "@/lib/utils";
import { AqiBadge } from "@/components/aqi-badge";
import { AQI_BORDER_CLASSES } from "@/components/aqi-styles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAirWindow, formatPm25, trendText } from "@/lib/air/format";
import type { AirDigest } from "@/lib/air/digest-schema";

/**
 * Props for the current air summary card.
 */
export interface AirCardProps {
  digest: AirDigest;
}

/**
 * Shows today's US AQI, PM2.5, trend, clean windows and smog cues.
 */
export function AirCard({ digest }: AirCardProps) {
  return (
    <Card
      aria-labelledby="air-card-heading"
      className={cn(
        "rounded-lg border border-border border-l-4 ring-0",
        AQI_BORDER_CLASSES[digest.usCategory.level],
      )}
    >
      <CardHeader>
        <CardTitle>
          <h2
            id="air-card-heading"
            className="text-xl font-semibold tracking-tight"
          >
            {"Today's air"}
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">US AQI</p>
            <p className="text-5xl font-semibold tabular-nums">
              {digest.usAqi}
            </p>
          </div>
          <AqiBadge category={digest.usCategory} />
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">PM2.5</dt>
            <dd className="text-base font-medium">
              {formatPm25(digest.pm2_5)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">PM2.5 trend</dt>
            <dd className="text-base font-medium">{trendText(digest.trend)}</dd>
          </div>
          {digest.cpcbCategory !== null && (
            <div>
              <dt className="text-sm text-muted-foreground">CPCB category</dt>
              <dd className="text-base font-medium">
                {digest.cpcbCategory.label}
              </dd>
            </div>
          )}
        </dl>

        <div className="space-y-1 text-sm">
          <p>
            Best time outside:{" "}
            <span className="font-medium">
              {formatAirWindow(digest.cleanestWindow)}
            </span>
          </p>
          <p>
            Worst time outside:{" "}
            <span className="font-medium">
              {formatAirWindow(digest.worstWindow)}
            </span>
          </p>
        </div>

        {digest.smogCues.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Smog cues</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {digest.smogCues.map((cue) => (
                <li key={cue}>{cue}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
