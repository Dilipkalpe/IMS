/** Line rows persisted to API / included in document totals. */
export function filterSavableLines<T extends { qty: number }>(lines: readonly T[]): T[] {
  return lines.filter((line) => line.qty > 0);
}

/** Human-readable list status from API document status. */
export function formatTransactionListStatus(status?: string): string {
  const key = String(status ?? 'open').trim().toLowerCase();
  switch (key) {
    case 'open':
      return 'Open';
    case 'paid':
      return 'Paid';
    case 'partial':
      return 'Partial';
    case 'draft':
      return 'Draft';
    case 'cancelled':
      return 'Cancelled';
    case 'posted':
      return 'Posted';
    default:
      return key
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
  }
}
