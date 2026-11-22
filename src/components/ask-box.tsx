"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AskAnswer } from "@/components/ask-answer";
import { AskHistory, type AskExchange } from "@/components/ask-history";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toAskPlan } from "@/lib/api/ask-plan";
import { askQuestion, toClientMessage } from "@/lib/api/client";
import type { ClientPlanWithImpact } from "@/lib/api/client-plan-schemas";
import type { PlaceInput } from "@/lib/api/schemas";
import {
  ASK_QUESTION_MAX_CHARS,
  ASK_QUESTION_MIN_CHARS,
  MAX_ASK_EXCHANGES,
} from "@/lib/config";
import type { Ask } from "@/lib/llm/plan-schema";
import type { Language } from "@/lib/llm/prompts";

const HINT =
  "Ask about today's plan. Do not include names, addresses, or medical details.";
const HINT_ID = "ask-hint";
const COUNT_ID = "ask-count";
const ERROR_ID = "ask-error";

/**
 * Props for the follow-up question box.
 */
export interface AskBoxProps {
  place: PlaceInput;
  plan: ClientPlanWithImpact;
  language: Language;
}

/**
 * Sends follow-up questions about the plan and keeps the last five exchanges.
 */
export function AskBox({ place, plan, language }: AskBoxProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Ask | null>(null);
  const [exchanges, setExchanges] = useState<AskExchange[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const trimmed = question.trim();
  const canAsk = trimmed.length >= ASK_QUESTION_MIN_CHARS && !isAsking;
  const describedBy =
    error === null
      ? `${HINT_ID} ${COUNT_ID}`
      : `${HINT_ID} ${COUNT_ID} ${ERROR_ID}`;

  useEffect(() => () => abort.current?.abort(), []);

  async function send(text: string) {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setIsAsking(true);
    setError(null);
    try {
      const result = await askQuestion(
        { place, question: text, plan: toAskPlan(plan), language },
        { signal: controller.signal },
      );
      setAnswer(result);
      setExchanges((current) =>
        [...current, { question: text, answer: result.answer }].slice(
          -MAX_ASK_EXCHANGES,
        ),
      );
      setQuestion("");
    } catch (caught) {
      if (!controller.signal.aborted) {
        setError(toClientMessage(caught));
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsAsking(false);
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canAsk) {
      void send(trimmed);
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
          onChange={(event) => setQuestion(event.target.value)}
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
            onClick={() => void send(trimmed)}
          >
            Try again
          </Button>
        </div>
      )}
      <AskHistory exchanges={exchanges.slice(0, -1)} />
      <div aria-live="polite">
        {answer !== null && (
          <AskAnswer answer={answer} onFollowUp={setQuestion} />
        )}
      </div>
    </div>
  );
}
