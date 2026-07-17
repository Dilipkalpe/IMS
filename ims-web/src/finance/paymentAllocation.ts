import { parseMoney } from '../sales-invoice/invoicePayment';

export interface AllocationRow {
  sourceDocId: string;
  sourceFormattedDocNo: string;
  invoiceDate?: string;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  allocationAmount: number;
}

export function sumAllocationAmounts(rows: AllocationRow[]): number {
  return rows.reduce((sum, row) => sum + parseMoney(row.allocationAmount), 0);
}

export function remainingPaymentBalance(voucherAmount: number, rows: AllocationRow[]): number {
  return Math.max(0, parseMoney(voucherAmount) - sumAllocationAmounts(rows));
}

export function validateAllocationRows(
  voucherAmount: number,
  rows: AllocationRow[],
): { ok: true } | { ok: false; message: string } {
  const amount = parseMoney(voucherAmount);
  if (amount <= 0) {
    return { ok: false, message: 'Payment amount must be greater than zero.' };
  }

  let total = 0;
  for (const row of rows) {
    const alloc = parseMoney(row.allocationAmount);
    if (alloc < 0) {
      return { ok: false, message: 'Allocation amounts cannot be negative.' };
    }
    if (alloc > row.outstandingBalance + 0.001) {
      return {
        ok: false,
        message: `Allocation for ${row.sourceFormattedDocNo} exceeds outstanding balance.`,
      };
    }
    total += alloc;
  }

  if (total > amount + 0.001) {
    return { ok: false, message: 'Total allocation exceeds payment amount.' };
  }

  if (total <= 0) {
    return { ok: false, message: 'Allocate at least one invoice amount.' };
  }

  return { ok: true };
}

export function buildAllocationPayload(rows: AllocationRow[]) {
  return rows
    .filter((row) => parseMoney(row.allocationAmount) > 0)
    .map((row) => ({
      sourceDocType: 'purchase_invoice',
      sourceDocId: row.sourceDocId,
      sourceFormattedDocNo: row.sourceFormattedDocNo,
      amount: parseMoney(row.allocationAmount),
    }));
}
