import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectVoucherInvoiceAllocations,
  parseMoney,
  validatePaymentAllocations,
} from './invoicePayment.js';

describe('invoicePayment', () => {
  it('parseMoney handles commas and invalid values', () => {
    assert.equal(parseMoney('1,234.50'), 1234.5);
    assert.equal(parseMoney(''), 0);
    assert.equal(parseMoney(undefined), 0);
    assert.equal(parseMoney('abc'), 0);
  });

  it('validatePaymentAllocations rejects over-allocation', () => {
    assert.throws(
      () =>
        validatePaymentAllocations(1000, [
          { amount: 600 },
          { amount: 500 },
        ]),
      /exceeds voucher amount/,
    );
  });

  it('validatePaymentAllocations allows partial allocation', () => {
    const result = validatePaymentAllocations(1000, [
      { amount: 400 },
      { amount: 200 },
    ]);
    assert.equal(result.totalAllocated, 600);
    assert.equal(result.unallocated, 400);
  });

  it('collectVoucherInvoiceAllocations prefers invoiceAllocations array', () => {
    const rows = collectVoucherInvoiceAllocations({
      amount: 500,
      sourceDocId: 'ignored',
      invoiceAllocations: [
        { sourceFormattedDocNo: 'PI-1', amount: 100 },
        { sourceFormattedDocNo: 'PI-2', amount: 200 },
      ],
    });
    assert.equal(rows.length, 2);
    assert.equal(rows[0].amount, 100);
    assert.equal(rows[1].sourceFormattedDocNo, 'PI-2');
  });

  it('collectVoucherInvoiceAllocations falls back to single source', () => {
    const rows = collectVoucherInvoiceAllocations({
      amount: 750,
      sourceDocType: 'purchase_invoice',
      sourceFormattedDocNo: 'PI-99',
      sourceDocId: 'abc123',
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].amount, 750);
    assert.equal(rows[0].sourceFormattedDocNo, 'PI-99');
  });
});
