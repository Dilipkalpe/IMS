import { describe, expect, it } from 'vitest';
import {
  isPaymentModeEnabled,
  resolvePaymentAmounts,
  resolveSaveStatus,
  uiPaymentMode,
} from './invoicePayment';

describe('invoicePayment', () => {
  it('resolves cash as fully paid', () => {
    const result = resolvePaymentAmounts(1000, { paymentType: 'Cash', paidAmount: 0 });
    expect(result).toEqual({ paidAmount: 1000, balanceDue: 0 });
    expect(resolveSaveStatus('Cash', 1000, 0)).toBe('paid');
  });

  it('resolves credit as unpaid balance', () => {
    const result = resolvePaymentAmounts(1250.5, { paymentType: 'Credit', paidAmount: 99 });
    expect(result).toEqual({ paidAmount: 0, balanceDue: 1250.5 });
    expect(resolveSaveStatus('Credit', 1250.5, 1250.5)).toBe('open');
  });

  it('caps partial paid amount to invoice total', () => {
    const result = resolvePaymentAmounts(500, { paymentType: 'Partial', paidAmount: 700 });
    expect(result).toEqual({ paidAmount: 500, balanceDue: 0 });
    expect(resolveSaveStatus('Partial', 500, 0)).toBe('paid');
  });

  it('disables payment mode for credit and uses placeholder mode', () => {
    expect(isPaymentModeEnabled('Credit')).toBe(false);
    expect(uiPaymentMode('Credit', '')).toBe('Cash');
    expect(uiPaymentMode('Cash', 'bank')).toBe('Bank');
  });
});
