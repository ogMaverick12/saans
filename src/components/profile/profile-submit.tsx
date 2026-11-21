import { Button } from "@/components/ui/button";

/**
 * Props for the form's privacy note and submit button.
 */
export interface ProfileSubmitProps {
  isSubmitting: boolean;
}

/**
 * Renders the privacy line and the plan submit button.
 */
export function ProfileSubmit({ isSubmitting }: ProfileSubmitProps) {
  return (
    <div className="space-y-3 border-t border-border pt-6">
      <p className="text-sm text-muted-foreground">
        Your answers are used only to write this plan. They are not stored.
      </p>
      <Button
        type="submit"
        size="lg"
        className="min-h-11"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Writing your plan…" : "Write my plan"}
      </Button>
    </div>
  );
}
