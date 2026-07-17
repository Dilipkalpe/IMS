/** Align with WPF AddSalesOrderViewModel / SalesOrdersViewModel.TryParseFormattedNo */
import { normalizeDocPrefix } from '../components/transaction/docPrefix';

export function normalizeSoPrefix(value?: string): string {
  return normalizeDocPrefix(value, 'SO');
}
export function parseFormattedSoNo(formatted?: string): { prefix: string; docNo: number } | null {
  if (!formatted?.trim()) return null;
  const value = formatted.trim();
  const dash = value.lastIndexOf('-');
  if (dash > 0 && dash < value.length - 1) {
    const prefix = normalizeSoPrefix(value.slice(0, dash));
    const docNo = parseInt(value.slice(dash + 1), 10);
    return Number.isFinite(docNo) && docNo > 0 ? { prefix, docNo } : null;
  }
  const docNo = parseInt(value, 10);
  return Number.isFinite(docNo) && docNo > 0 ? { prefix: 'SO', docNo } : null;
}
