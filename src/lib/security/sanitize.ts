import { FREE_TEXT_MAX_CHARS } from "@/lib/config";

const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F-\u009F]/g;
const ANGLE_BRACKETS = /[<>]/g;
const WHITESPACE = /\s+/g;

/**
 * Trims, strips control characters and angle brackets, collapses whitespace and truncates free text.
 */
export function sanitizeFreeText(input: string): string {
  return input
    .replace(CONTROL_CHARACTERS, "")
    .replace(ANGLE_BRACKETS, "")
    .replace(WHITESPACE, " ")
    .trim()
    .slice(0, FREE_TEXT_MAX_CHARS);
}
