import type { RefObject } from "react";
import type { ProfileFieldError } from "@/lib/profile/form";

export interface ErrorSummaryProps {
  errors: ProfileFieldError[];
  summaryRef: RefObject<HTMLDivElement | null>;
}

/**
 * Lists validation problems with links to each invalid field.
 */
export function ErrorSummary({ errors, summaryRef }: ErrorSummaryProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      ref={summaryRef}
      role="alert"
      tabIndex={-1}
      className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <h3 className="text-sm font-semibold text-destructive">
        Please check your answers
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {errors.map((error) => (
          <li key={error.field}>
            <a
              href={`#${error.fieldId}`}
              className="rounded-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
