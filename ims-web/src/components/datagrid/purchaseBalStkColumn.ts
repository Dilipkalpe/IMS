import type { DataGridColumn } from '../datagrid/CorporateDataGrid';
import { formatBalStk } from '../transaction/purchaseProductLines';

export function createBalStkColumn<T extends { balStk?: number; productRetailCode?: string }>(): DataGridColumn<T> {
  return {
    id: 'balStk',
    header: 'Bal Stk',
    width: 72,
    readOnly: true,
    getValue: (row) =>
      row.productRetailCode?.trim() ? formatBalStk(row.balStk) : '',
  };
}
