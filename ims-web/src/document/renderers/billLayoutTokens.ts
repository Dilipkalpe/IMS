import { DOCUMENT_TYPE_LABELS } from '../contracts/documentTypes';
import type { PrintableDocumentV1, PrintableLineV1 } from '../contracts/printableDocument';

export interface BillPrintContext {
  documentTitle: string;
  invoiceNo: string;
  formattedDocNo: string;
  documentDate: string;
  dueDate: string;
  customerName: string;
  customerGstin: string;
  sellerName: string;
  sellerGstin: string;
  placeOfSupply: string;
  paymentType: string;
  paymentMode: string;
  reference: string;
  narration: string;
}

export function buildBillPrintContext(document: PrintableDocumentV1): BillPrintContext {
  const h = document.header;
  return {
    documentTitle: DOCUMENT_TYPE_LABELS[document.documentType] ?? document.documentType,
    invoiceNo: h.docNo,
    formattedDocNo: h.formattedDocNo,
    documentDate: h.documentDate,
    dueDate: h.dueDate ?? '',
    customerName: document.buyer.name,
    customerGstin: document.buyer.gstin ?? '',
    sellerName: document.seller.name,
    sellerGstin: document.seller.gstin ?? '',
    placeOfSupply: document.placeOfSupply,
    paymentType: h.paymentType ?? '',
    paymentMode: h.paymentMode ?? '',
    reference: h.reference ?? '',
    narration: h.narration ?? '',
  };
}

const TOKEN_MAP: Record<string, keyof BillPrintContext> = {
  documentTitle: 'documentTitle',
  invoiceNo: 'invoiceNo',
  formattedDocNo: 'formattedDocNo',
  documentDate: 'documentDate',
  dueDate: 'dueDate',
  customerName: 'customerName',
  customerGstin: 'customerGstin',
  sellerName: 'sellerName',
  sellerGstin: 'sellerGstin',
  placeOfSupply: 'placeOfSupply',
  paymentType: 'paymentType',
  paymentMode: 'paymentMode',
  reference: 'reference',
  narration: 'narration',
};

/** WPF: SalesBillLayoutHelper.ReplaceTokens */
export function replaceBillTokens(text: string, ctx: BillPrintContext): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => {
    const field = TOKEN_MAP[key];
    return field ? String(ctx[field] ?? '') : '';
  });
}

export function lineColumnValue(columnKey: string, line: PrintableLineV1): string {
  switch (columnKey) {
    case 'srNo':
      return String(line.lineNo);
    case 'itemCode':
      return line.productCode;
    case 'hsnCode':
      return '';
    case 'description':
      return line.description;
    case 'qty':
      return String(line.qty);
    case 'rate':
      return line.rate.toFixed(2);
    case 'salesRate':
      return line.salesRate.toFixed(2);
    case 'discount':
      return line.discPercent.toFixed(2);
    case 'gstPercent': {
      const pct = line.igstPercent > 0 ? line.igstPercent : line.cgstPercent + line.sgstPercent;
      return pct.toFixed(2);
    }
    case 'taxable':
      return line.taxable.toFixed(2);
    case 'cgstAmount':
      return line.cgstAmount.toFixed(2);
    case 'sgstAmount':
      return line.sgstAmount.toFixed(2);
    case 'igstAmount':
      return line.igstAmount.toFixed(2);
    case 'amount':
      return line.lineTotal.toFixed(2);
    default:
      return '';
  }
}
