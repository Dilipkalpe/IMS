import type { InvoicePaymentInput } from './invoicePayment';
import { resolvePaymentAmounts } from './invoicePayment';
import type { SalesInvoiceLineComputed, SalesInvoiceLineItem, SalesInvoiceTotals } from './types';
import {
  type GstTaxContext,
  gstContextFromHeader,
  isInterStateSupply,
  validateGstTax,
} from './gstTax';

export type { GstTaxContext, GstValidationMessage } from './gstTax';
export {
  extractStateCode,
  gstContextFromHeader,
  INDIAN_STATE_OPTIONS,
  isInterStateSupply,
  resolveCompanyStateCode,
  stateCodeFromGstin,
  validateGstTax,
} from './gstTax';

const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '0.00');

/** Combined GST rate % stored on the line (CGST+SGST or IGST column). */
export function combinedGstRatePercent(line: SalesInvoiceLineItem): number {
  const cgst = Math.max(0, line.cgstPercent || 0);
  const sgst = Math.max(0, line.sgstPercent || 0);
  const igst = Math.max(0, line.igstPercent || 0);
  if (igst > 0 && cgst === 0 && sgst === 0) return igst;
  const intra = cgst + sgst;
  return intra > 0 ? intra : igst;
}

export function resolveLineTaxPercents(
  line: SalesInvoiceLineItem,
  isInterState: boolean,
): { cgstPercent: number; sgstPercent: number; igstPercent: number } {
  const rate = combinedGstRatePercent(line);
  if (rate <= 0) return { cgstPercent: 0, sgstPercent: 0, igstPercent: 0 };
  if (isInterState) return { cgstPercent: 0, sgstPercent: 0, igstPercent: rate };
  const half = rate / 2;
  return { cgstPercent: half, sgstPercent: half, igstPercent: 0 };
}

function lineTaxableAmount(item: SalesInvoiceLineItem): number {
  const qty = Math.max(0, item.qty || 0);
  const rate = Math.max(0, item.rate || 0);
  const discPct = Math.min(100, Math.max(0, item.discPercent || 0));
  const gross = qty * rate;
  const disc = (gross * discPct) / 100;
  return Math.max(0, gross - disc);
}

/**
 * Line tax amounts — when context is set, applies intra (CGST+SGST) vs inter (IGST only).
 * Without context, uses stored line percents (legacy / tests).
 */
export function computeLine(item: SalesInvoiceLineItem, context?: GstTaxContext): SalesInvoiceLineComputed {
  const taxable = lineTaxableAmount(item);
  const rate = combinedGstRatePercent(item);

  if (rate <= 0) {
    return { taxable, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, lineTotal: taxable };
  }

  if (!context) {
    const cgstAmount = (taxable * (item.cgstPercent || 0)) / 100;
    const sgstAmount = (taxable * (item.sgstPercent || 0)) / 100;
    const igstAmount = (taxable * (item.igstPercent || 0)) / 100;
    return {
      taxable,
      cgstAmount,
      sgstAmount,
      igstAmount,
      lineTotal: taxable + cgstAmount + sgstAmount + igstAmount,
    };
  }

  const inter = isInterStateSupply(context);
  const percents = resolveLineTaxPercents(item, inter);
  const cgstAmount = (taxable * percents.cgstPercent) / 100;
  const sgstAmount = (taxable * percents.sgstPercent) / 100;
  const igstAmount = (taxable * percents.igstPercent) / 100;
  return {
    taxable,
    cgstAmount,
    sgstAmount,
    igstAmount,
    lineTotal: taxable + cgstAmount + sgstAmount + igstAmount,
  };
}

export function computeTotals(
  lines: SalesInvoiceLineItem[],
  context?: GstTaxContext,
  payment?: InvoicePaymentInput,
): SalesInvoiceTotals {
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalDiscount = 0;

  for (const line of lines) {
    const qty = Math.max(0, line.qty || 0);
    const rate = Math.max(0, line.rate || 0);
    const discPct = Math.min(100, Math.max(0, line.discPercent || 0));
    const gross = qty * rate;
    const disc = (gross * discPct) / 100;
    const c = computeLine(line, context);
    totalTaxable += c.taxable;
    totalCgst += c.cgstAmount;
    totalSgst += c.sgstAmount;
    totalIgst += c.igstAmount;
    totalDiscount += disc;
  }

  const rawTotal = totalTaxable + totalCgst + totalSgst + totalIgst;
  const invoiceTotal = Math.round(rawTotal * 100) / 100;
  const { paidAmount, balanceDue } = payment
    ? resolvePaymentAmounts(invoiceTotal, payment)
    : { paidAmount: 0, balanceDue: invoiceTotal };
  const roundOff = invoiceTotal - rawTotal;

  return {
    totalTaxable,
    totalCgst,
    totalSgst,
    totalIgst,
    totalDiscount,
    invoiceTotal,
    paidAmount,
    balanceDue,
    roundOff,
  };
}

export function formatDisplay(n: number): string {
  return fmt(n);
}

/** Header-driven tax context for screens and print mappers. */
export function taxContextFromHeader(header: {
  placeOfSupply: string;
  sellerGstin: string;
  customerGstin: string;
}): GstTaxContext {
  return gstContextFromHeader(header);
}

export function collectGstFieldErrors(context: GstTaxContext): { field: string; message: string }[] {
  return validateGstTax(context)
    .filter((m) => m.severity === 'error' && m.field)
    .map((m) => ({ field: m.field!, message: m.message }));
}
