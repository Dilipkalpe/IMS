/** Safe en-IN number formatting for UI labels and tooltips. */
export function formatLocaleNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions,
): string {
  const n = Number(value ?? 0);
  return (Number.isFinite(n) ? n : 0).toLocaleString('en-IN', options);
}

export function coerceFiniteNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Align numeric series to label count; missing entries become 0. */
export function normalizeNumericSeries(values: unknown[] | undefined, labelCount: number): number[] {
  const source = values ?? [];
  return Array.from({ length: labelCount }, (_, index) => coerceFiniteNumber(source[index]));
}
