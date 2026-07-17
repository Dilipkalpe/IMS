import { describe, expect, it } from 'vitest';
import {
  combinedGstRatePercent,
  computeLine,
  computeTotals,
  resolveLineTaxPercents,
  taxContextFromHeader,
} from './calculations';
import { extractStateCode, isInterStateSupply } from './gstTax';
import type { SalesInvoiceLineItem } from './types';

function line(partial: Partial<SalesInvoiceLineItem> & { sr: number }): SalesInvoiceLineItem {
  const { sr, ...rest } = partial;
  return {
    id: `line-${sr}`,
    sr,
    productRetailCode: 'P1',
    itemDescription: 'Test',
    qty: 10,
    rate: 100,
    salesRate: 100,
    discPercent: 0,
    cgstPercent: 2.5,
    sgstPercent: 2.5,
    igstPercent: 0,
    ...rest,
  };
}

const sellerHeader = {
  placeOfSupply: '24-Gujarat',
  sellerGstin: '24AABCU9603R1ZM',
  customerGstin: '',
};

describe('GST state codes', () => {
  it('extracts code from WPF-style place of supply', () => {
    expect(extractStateCode('24-Gujarat')).toBe('24');
    expect(extractStateCode('27-Maharashtra')).toBe('27');
  });

  it('maps legacy state names', () => {
    expect(extractStateCode('Gujarat')).toBe('24');
    expect(extractStateCode('Maharashtra')).toBe('27');
  });
});

describe('inter-state determination', () => {
  it('intra-state when place matches seller GSTIN state', () => {
    expect(isInterStateSupply(taxContextFromHeader(sellerHeader))).toBe(false);
  });

  it('inter-state when place differs from company state', () => {
    expect(
      isInterStateSupply(
        taxContextFromHeader({ ...sellerHeader, placeOfSupply: '27-Maharashtra' }),
      ),
    ).toBe(true);
  });
});

describe('tax split (5% GST)', () => {
  const intraCtx = taxContextFromHeader(sellerHeader);
  const interCtx = taxContextFromHeader({ ...sellerHeader, placeOfSupply: '27-Maharashtra' });

  it('intra-state: CGST + SGST, no IGST', () => {
    const l = line({ sr: 1 });
    const c = computeLine(l, intraCtx);
    expect(c.taxable).toBe(1000);
    expect(c.cgstAmount).toBe(25);
    expect(c.sgstAmount).toBe(25);
    expect(c.igstAmount).toBe(0);
    expect(c.lineTotal).toBe(1050);
  });

  it('inter-state: IGST only', () => {
    const l = line({ sr: 1 });
    const c = computeLine(l, interCtx);
    expect(c.cgstAmount).toBe(0);
    expect(c.sgstAmount).toBe(0);
    expect(c.igstAmount).toBe(50);
    expect(c.lineTotal).toBe(1050);
  });

  it('zero-rated: no tax when combined rate is 0', () => {
    const l = line({ sr: 1, cgstPercent: 0, sgstPercent: 0, igstPercent: 0 });
    const c = computeLine(l, intraCtx);
    expect(c.lineTotal).toBe(1000);
    expect(c.cgstAmount).toBe(0);
  });
});

describe('mixed line rates', () => {
  const interCtx = taxContextFromHeader({ ...sellerHeader, placeOfSupply: '07-Delhi' });

  it('sums lines with different GST rates on interstate invoice', () => {
    const lines = [
      line({ sr: 1, cgstPercent: 2.5, sgstPercent: 2.5, qty: 1, rate: 100 }),
      line({ sr: 2, cgstPercent: 6, sgstPercent: 6, qty: 1, rate: 100 }),
    ];
    const totals = computeTotals(lines, interCtx);
    expect(totals.totalIgst).toBe(5 + 12);
    expect(totals.totalCgst).toBe(0);
    expect(totals.totalSgst).toBe(0);
  });
});

describe('place-of-supply change recalculates split', () => {
  it('same lines flip from CGST+SGST to IGST when POS changes', () => {
    const l = line({ sr: 1 });
    const intra = computeTotals([l], taxContextFromHeader(sellerHeader));
    const inter = computeTotals(
      [l],
      taxContextFromHeader({ ...sellerHeader, placeOfSupply: '27-Maharashtra' }),
    );
    expect(intra.totalCgst + intra.totalSgst).toBe(50);
    expect(intra.totalIgst).toBe(0);
    expect(inter.totalIgst).toBe(50);
    expect(inter.totalCgst + inter.totalSgst).toBe(0);
  });
});

describe('resolveLineTaxPercents', () => {
  it('shows IGST column for inter-state', () => {
    const l = line({ sr: 1 });
    expect(resolveLineTaxPercents(l, true)).toEqual({ cgstPercent: 0, sgstPercent: 0, igstPercent: 5 });
    expect(resolveLineTaxPercents(l, false)).toEqual({ cgstPercent: 2.5, sgstPercent: 2.5, igstPercent: 0 });
  });
});

describe('combinedGstRatePercent', () => {
  it('reads IGST-only lines', () => {
    expect(combinedGstRatePercent(line({ sr: 1, cgstPercent: 0, sgstPercent: 0, igstPercent: 18 }))).toBe(18);
  });
});
