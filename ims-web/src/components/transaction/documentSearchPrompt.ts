/** Prompt for formatted document number (desktop Search F9 — enabled on web). */
export function promptDocumentSearch(currentFormatted?: string): string | null {
  const initial = currentFormatted?.trim() ?? '';
  const value = window.prompt('Enter document number (e.g. SO-101):', initial);
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed || null;
}
