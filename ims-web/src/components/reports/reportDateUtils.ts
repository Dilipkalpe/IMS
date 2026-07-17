/** ISO date (YYYY-MM-DD) for HTML date inputs. */

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** WPF document register default: first day of month, 2 months ago → today. */
export function defaultRegisterDateRange(): { from: string; to: string } {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  return { from: toIsoDate(from), to: toIsoDate(today) };
}

/** WPF sales analysis default: financial year start (Apr 1) → today. */
export function defaultSalesAnalysisDateRange(): { from: string; to: string } {
  const today = new Date();
  const fyStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  const from = new Date(fyStartYear, 3, 1);
  return { from: toIsoDate(from), to: toIsoDate(today) };
}

export function defaultAsOnDate(): string {
  return toIsoDate(new Date());
}

export function formatMoney(value: number): string {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNum(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}
