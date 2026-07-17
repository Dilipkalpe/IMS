import { describe, expect, it } from 'vitest';
import {
  remainingPaymentBalance,
  sumAllocationAmounts,
  validateAllocationRows,
  type AllocationRow,
} from './paymentAllocation';

const sampleRows: AllocationRow[] = [
  {
    sourceDocId: '1',
    sourceFormattedDocNo: 'PI-1',
    totalAmount: 1000,
    paidAmount: 200,
    outstandingBalance: 800,
    allocationAmount: 300,
  },
  {
    sourceDocId: '2',
    sourceFormattedDocNo: 'PI-2',
    totalAmount: 500,
    paidAmount: 0,
    outstandingBalance: 500,
    allocationAmount: 200,
  },
];

describe('paymentAllocation', () => {
  it('sums allocation amounts', () => {
    expect(sumAllocationAmounts(sampleRows)).toBe(500);
  });

  it('calculates remaining payment balance', () => {
    expect(remainingPaymentBalance(1000, sampleRows)).toBe(500);
  });

  it('rejects over-allocation against voucher amount', () => {
    const result = validateAllocationRows(
      400,
      sampleRows.map((row) => ({ ...row, allocationAmount: 300 })),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/exceeds payment amount/);
  });

  it('rejects allocation above invoice outstanding', () => {
    const result = validateAllocationRows(1000, [
      { ...sampleRows[0], allocationAmount: 900 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/exceeds outstanding/);
  });

  it('accepts valid partial allocations', () => {
    expect(validateAllocationRows(1000, sampleRows).ok).toBe(true);
  });
});
