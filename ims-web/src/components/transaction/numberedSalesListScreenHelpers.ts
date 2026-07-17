import { useCallback } from 'react';
import { numberedSalesSortField } from './transactionListQuery';

export const NUMBERED_SALES_SORTABLE_COLUMN_IDS = [
  'billNo',
  'date',
  'customer',
  'amount',
  'status',
] as const;

export function useNumberedSalesSortField(
  dateField: 'invoiceDate' | 'dcDate' | 'returnDate',
): (columnId: string) => string {
  return useCallback((columnId: string) => numberedSalesSortField(columnId, dateField), [dateField]);
}
