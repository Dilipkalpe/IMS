import { LIST_PAGE_SIZES } from './transactionListQuery';

export interface TransactionListPaginationProps {
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function TransactionListPagination({
  page,
  pageSize,
  totalPages,
  totalRecords,
  loading = false,
  onPageChange,
  onPageSizeChange,
}: TransactionListPaginationProps) {
  const pageInfo = `Page ${page} of ${totalPages} · ${totalRecords.toLocaleString()} total · ${pageSize} per page`;

  return (
    <div className="si-list-pagination si-list-pagination--paged">
      <label className="si-list-pagination__size">
        Page size
        <select
          value={pageSize}
          disabled={loading}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {LIST_PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <span className="si-list-pagination__info">{pageInfo}</span>
      <div className="si-list-pagination__nav">
        <button
          type="button"
          className="wpf-secondary-button"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(1)}
        >
          First
        </button>
        <button
          type="button"
          className="wpf-secondary-button"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Prev
        </button>
        <button
          type="button"
          className="wpf-secondary-button"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
        </button>
        <button
          type="button"
          className="wpf-secondary-button"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(totalPages)}
        >
          Last
        </button>
      </div>
    </div>
  );
}
