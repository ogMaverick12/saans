import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Props for a safe, retryable error message.
 */
export interface ErrorNoticeProps {
  title: string;
  message: string;
  onRetry: () => void;
}

/**
 * Shows a clear error message with a retry button.
 */
export function ErrorNotice({ title, message, onRetry }: ErrorNoticeProps) {
  return (
    <Card
      role="alert"
      className="rounded-lg border border-destructive/40 ring-0"
    >
      <CardHeader>
        <CardTitle>
          <h2 className="text-lg font-semibold">{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{message}</p>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-11"
          onClick={onRetry}
        >
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
