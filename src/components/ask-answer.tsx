import { Button } from "@/components/ui/button";
import type { Ask } from "@/lib/llm/plan-schema";

/**
 * Props for the latest answer and its follow-up suggestions.
 */
export interface AskAnswerProps {
  answer: Ask;
  onFollowUp: (question: string) => void;
}

/**
 * Shows the latest answer with buttons that fill the question box.
 */
export function AskAnswer({ answer, onFollowUp }: AskAnswerProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm">{answer.answer}</p>
      {answer.followUps.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Follow-up questions</p>
          <div className="flex flex-wrap gap-2">
            {answer.followUps.map((followUp) => (
              <Button
                key={followUp}
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 whitespace-normal text-left"
                onClick={() => onFollowUp(followUp)}
              >
                {followUp}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
