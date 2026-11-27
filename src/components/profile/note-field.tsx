import { Label } from "@/components/ui/label";
import { FREE_TEXT_MAX_CHARS } from "@/lib/config";

const NOTE_HINT = "Do not include names, addresses, or medical details.";
const NOTE_HINT_ID = "profile-note-hint";
const NOTE_COUNT_ID = "profile-note-count";
const NOTE_ERROR_ID = "profile-note-error";

/**
 * Props for the optional free-text note.
 */
export interface NoteFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/**
 * Renders the optional household note with a character counter.
 */
export function NoteField({ value, onChange, error }: NoteFieldProps) {
  const describedBy =
    error === undefined
      ? `${NOTE_HINT_ID} ${NOTE_COUNT_ID}`
      : `${NOTE_HINT_ID} ${NOTE_COUNT_ID} ${NOTE_ERROR_ID}`;

  return (
    <div className="space-y-2">
      <Label htmlFor="profile-note">
        Anything else we should know? (optional)
      </Label>
      <p id={NOTE_HINT_ID} className="text-sm text-muted-foreground">
        {NOTE_HINT}
      </p>
      <textarea
        id="profile-note"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={FREE_TEXT_MAX_CHARS}
        rows={4}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={describedBy}
        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
      />
      <p id={NOTE_COUNT_ID} className="text-sm text-muted-foreground">
        {value.length} of {FREE_TEXT_MAX_CHARS} characters
      </p>
      {error !== undefined && (
        <p id={NOTE_ERROR_ID} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
