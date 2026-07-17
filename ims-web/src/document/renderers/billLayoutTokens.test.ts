import { describe, expect, it } from 'vitest';
import type { PrintableDocumentV1 } from '../contracts/printableDocument';
import { buildBillPrintContext, lineColumnValue, replaceBillTokens } from './billLayoutTokens';

const sampleDoc: PrintableDocumentV1 = {
  schemaVersion: 1,
  documentType: 'sales_invoice',
  generatedAt: '2026-06-06T00:00:00.000Z',
  header: {
    docPrefix: 'SI',
    docNo: '1001',
    formattedDocNo: 'SI-1001',
    documentDate: '2026-06-06',
    paymentType: 'Credit',
    paymentMode: 'Bank',
  },
  seller: { name: 'IMS Company', gstin: '27AAAAA0000A1Z5' },
  buyer: { name: 'Acme Traders', gstin: '27BBBBB0000B1Z5' },
  placeOfSupply: 'Maharashtra',
  lines: [
    {
      lineNo: 1,
      productCode: 'P0001',
      description: 'Widget',
      qty: 2,
      rate: 100,
      salesRate: 100,
      discPercent: 0,
      taxable: 200,
      cgstPercent: 9,
      cgstAmount: 18,
      sgstPercent: 9,
      sgstAmount: 18,
      igstPercent: 0,
      igstAmount: 0,
      lineTotal: 236,
    },
  ],
  totals: {
    totalTaxable: 200,
    totalCgst: 18,
    totalSgst: 18,
    totalIgst: 0,
    totalDiscount: 0,
    invoiceTotal: 236,
    paidAmount: 0,
    balanceDue: 236,
    roundOff: 0,
  },
};

describe('billLayoutTokens', () => {
  it('replaces document title tokens', () => {
    const ctx = buildBillPrintContext(sampleDoc);
    expect(replaceBillTokens('{{documentTitle}} #{{formattedDocNo}}', ctx)).toBe(
      'Sales Invoice #SI-1001',
    );
  });

  it('maps line column values', () => {
    const line = sampleDoc.lines[0];
    expect(lineColumnValue('amount', line)).toBe('236.00');
    expect(lineColumnValue('gstPercent', line)).toBe('18.00');
  });
});
