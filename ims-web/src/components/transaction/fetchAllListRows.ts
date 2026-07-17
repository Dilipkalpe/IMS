import type { TransactionListFetchRepository } from './useTransactionListLoader';
import type { TransactionListQueryBase } from './transactionListQuery';

const EXPORT_PAGE_SIZE = 500;

/** WPF: SalesOrderListExportService.FetchAllFilteredAsync */
export async function fetchAllListRows<TRow>(
  repository: TransactionListFetchRepository,
  baseQuery: Omit<TransactionListQueryBase, 'page' | 'limit'>,
  mapRows: (items: unknown[], mode: 'http' | 'local') => TRow[],
  onProgress?: (loaded: number, total: number) => void,
): Promise<TRow[]> {
  const all: TRow[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (all.length < total) {
    const result = await repository.fetchList({
      ...baseQuery,
      page,
      limit: EXPORT_PAGE_SIZE,
    });
    total = result.total;
    const mapped = mapRows(result.items, repository.mode);
    if (mapped.length === 0) break;
    all.push(...mapped);
    onProgress?.(all.length, total);
    if (mapped.length < EXPORT_PAGE_SIZE) break;
    page += 1;
  }

  return all;
}
