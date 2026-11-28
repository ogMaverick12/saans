"use client";

import { useEffect, useRef, useState } from "react";
import { AskAnswer } from "@/components/ask-answer";
import { AskForm } from "@/components/ask-form";
import { AskHistory, type AskExchange } from "@/components/ask-history";
import { toAskPlan } from "@/lib/api/ask-plan";
import { askQuestion, toClientMessage } from "@/lib/client/client";
import type { ClientPlanWithImpact } from "@/lib/client/client-plan-schemas";
import type { PlaceInput } from "@/lib/api/schemas";
import { MAX_ASK_EXCHANGES } from "@/lib/config";
import type { Ask } from "@/lib/llm/plan-schema";
import type { Language } from "@/lib/llm/prompts";

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

  return (
    <div className="space-y-4">
      <AskForm
        question={question}
        isAsking={isAsking}
        error={error}
        onQuestionChange={setQuestion}
        onSubmit={(text) => void send(text)}
      />
      <AskHistory exchanges={exchanges.slice(0, -1)} />
      <div aria-live="polite">
        {answer !== null && (
          <AskAnswer answer={answer} onFollowUp={setQuestion} />
        )}
      </div>
    </div>
  );
}
