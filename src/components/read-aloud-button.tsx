"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import type { ClientPlanWithImpact } from "@/lib/api/client-plan-schemas";
import {
  buildReadAloudText,
  READ_ALOUD_LANGUAGES,
} from "@/lib/llm/plan-display";
import type { Language } from "@/lib/llm/prompts";

function subscribe(): () => void {
  return () => {};
}

/**
 * Checks whether the browser can speak text aloud.
 */
function hasSpeechSynthesis(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis?.speak === "function" &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

function serverHasSpeechSynthesis(): boolean {
  return false;
}

/**
 * Props for the plan read-aloud control.
 */
export interface ReadAloudButtonProps {
  plan: ClientPlanWithImpact;
  language: Language;
}

/**
 * Reads the plan's headline, routine and indoor hacks aloud, or stops reading.
 */
export function ReadAloudButton({ plan, language }: ReadAloudButtonProps) {
  const available = useSyncExternalStore(
    subscribe,
    hasSpeechSynthesis,
    serverHasSpeechSynthesis,
  );
  const [speaking, setSpeaking] = useState(false);

  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
    },
    [],
  );

  if (!available) {
    return null;
  }

  function stop() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function start() {
    const utterance = new SpeechSynthesisUtterance(buildReadAloudText(plan));
    utterance.lang = READ_ALOUD_LANGUAGES[language];
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="min-h-11"
      aria-pressed={speaking}
      onClick={speaking ? stop : start}
    >
      {speaking ? "Stop reading" : "Read the plan aloud"}
    </Button>
  );
}
