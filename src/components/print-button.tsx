import { Button } from "@/components/ui/button";

/**
 * Opens the browser print dialog so the plan can be printed or saved as PDF.
 */
export function PrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="min-h-11"
      onClick={() => window.print()}
    >
      Print or save as PDF
    </Button>
  );
}
