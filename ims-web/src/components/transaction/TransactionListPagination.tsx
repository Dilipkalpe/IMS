import { LIST_PAGE_SIZES } from './transactionListQuery';

export interface TransactionListPaginationProps {
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  variant?: 'default' | 'sales';
}

export function TransactionListPagination({
  page,
  pageSize,
  totalPages,
  totalRecords,
  loading = false,
  onPageChange,
  onPageSizeChange,
  variant = 'default',
}: TransactionListPaginationProps) {
  const total = totalRecords ?? 0;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(page * pageSize, total);
  const pageInfo =
    variant === 'sales'
      ? `Showing ${start.toLocaleString('en-IN')} to ${end.toLocaleString('en-IN')} of ${total.toLocaleString('en-IN')} entries`
      : `Page ${page} of ${totalPages} · ${total.toLocaleString('en-IN')} total · ${pageSize} per page`;

  if (variant === 'sales') {
    return (
      <div className="si-list-pagination si-list-pagination--paged si-list-pagination--sales">
        <span className="si-list-pagination__info">{pageInfo}</span>
        <div className="si-list-pagination__nav">
          <button
            type="button"
            className="si-list-pagination__arrow"
            disabled={page <= 1 || loading}
            aria-label="Previous page"
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            ‹
          </button>
          <button type="button" className="si-list-pagination__page-btn si-list-pagination__page-btn--active" disabled>
            {page}
          </button>
          <button
            type="button"
            className="si-list-pagination__arrow"
            disabled={page >= totalPages || loading}
            aria-label="Next page"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            ›
          </button>
          <label className="si-list-pagination__size">
            <select
              value={pageSize}
              disabled={loading}
              aria-label="Rows per page"
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {LIST_PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    );
  }

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
