"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ASK_QUESTION_MAX_CHARS, ASK_QUESTION_MIN_CHARS } from "@/lib/config";

const HINT =
  "Ask about today's plan. Do not include names, addresses, or medical details.";
const HINT_ID = "ask-hint";
const COUNT_ID = "ask-count";
const ERROR_ID = "ask-error";

export interface AskFormProps {
  question: string;
  isAsking: boolean;
  error: string | null;
  onQuestionChange: (value: string) => void;
  onSubmit: (question: string) => void;
}

/**
 * Renders the question textarea, character count, submit button and retry notice.
 */
export function AskForm({
  question,
  isAsking,
  error,
  onQuestionChange,
  onSubmit,
}: AskFormProps) {
  const trimmed = question.trim();
  const canAsk = trimmed.length >= ASK_QUESTION_MIN_CHARS && !isAsking;
  const describedBy =
    error === null
      ? `${HINT_ID} ${COUNT_ID}`
      : `${HINT_ID} ${COUNT_ID} ${ERROR_ID}`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canAsk) {
      onSubmit(trimmed);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3" aria-busy={isAsking}>
        <Label htmlFor="ask-question">Your question</Label>
        <p id={HINT_ID} className="text-sm text-muted-foreground">
          {HINT}
        </p>
        <textarea
          id="ask-question"
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          maxLength={ASK_QUESTION_MAX_CHARS}
          rows={3}
          aria-invalid={error !== null}
          aria-describedby={describedBy}
          className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        />
        <p id={COUNT_ID} className="text-sm text-muted-foreground">
          {question.length} of {ASK_QUESTION_MAX_CHARS} characters
        </p>
        <Button type="submit" size="lg" className="min-h-11" disabled={!canAsk}>
          {isAsking ? "Asking…" : "Ask Saans"}
        </Button>
      </form>
      {error !== null && (
        <div
          id={ERROR_ID}
          role="alert"
          className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm"
        >
          <p>{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            disabled={!canAsk}
            onClick={() => onSubmit(trimmed)}
          >
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
