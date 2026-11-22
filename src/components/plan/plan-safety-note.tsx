/**
 * Props for the plan's safety note.
 */
export interface PlanSafetyNoteProps {
  doctorNote: string | null;
}

/**
 * Shows the doctor note, when present, beside a not-medical-advice note.
 */
export function PlanSafetyNote({ doctorNote }: PlanSafetyNoteProps) {
  return (
    <aside
      aria-labelledby="safety-heading"
      className="rounded-lg border border-border bg-muted/30 p-4 text-sm"
    >
      <h3 id="safety-heading" className="font-semibold">
        Before you start
      </h3>
      {doctorNote !== null && <p className="mt-2">{doctorNote}</p>}
      <p className="mt-2 text-muted-foreground">Not medical advice.</p>
    </aside>
  );
}
