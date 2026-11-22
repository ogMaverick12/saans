/**
 * One question and answer kept in the ask box history.
 */
export interface AskExchange {
  question: string;
  answer: string;
}

/**
 * Props for the earlier question-and-answer pairs.
 */
export interface AskHistoryProps {
  exchanges: readonly AskExchange[];
}

/**
 * Lists earlier questions and answers, newest last.
 */
export function AskHistory({ exchanges }: AskHistoryProps) {
  if (exchanges.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Earlier questions</h3>
      <ol className="space-y-3">
        {exchanges.map((exchange, index) => (
          <li
            key={`${index}-${exchange.question}`}
            className="space-y-1 border-t border-border pt-3"
          >
            <p className="text-sm font-medium">{exchange.question}</p>
            <p className="text-sm text-muted-foreground">{exchange.answer}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
