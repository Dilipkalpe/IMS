import type { DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import './sales-list-layout.scss';

export function renderSalesDocLink(billNo: string, onOpen: () => void) {
  return (
    <button
      type="button"
      className="sales-list-doc-link"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
    >
      {billNo}
    </button>
  );
}

export function renderSalesStatusPill(status: string) {
  const slug = status.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return (
    <span className={`sales-list-status-pill sales-list-status-pill--${slug || 'default'}`}>
      {status}
    </span>
  );
}

export function salesListDocNoColumn<T extends { billNo: string }>(
  header: string,
  onOpen: (row: T) => void,
  width = 120,
): DataGridColumn<T> {
  return {
    id: 'billNo',
    header,
    width,
    readOnly: true,
    render: (row) => renderSalesDocLink(row.billNo, () => onOpen(row)),
    getValue: (r) => r.billNo,
  };
}

export function salesListStatusColumn<T extends { status: string }>(): DataGridColumn<T> {
  return {
    id: 'status',
    header: 'Status',
    width: 100,
    readOnly: true,
    render: (row) => renderSalesStatusPill(row.status),
    getValue: (r) => r.status,
  };
}

export function salesListAmountColumn<T extends { amount: string }>(
  header = 'Order Total',
): DataGridColumn<T> {
  return {
    id: 'amount',
    header,
    width: 110,
    readOnly: true,
    getValue: (r) => r.amount,
  };
}
