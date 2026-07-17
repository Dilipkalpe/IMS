import { LAYOUT_SCHEMA_VERSION } from './layoutSchema.js';
import { buildTaxInvoiceLayout } from './taxInvoiceLayout.js';

const W = 190;
const BRAND = '#5c4033';

export function buildProfessionalLayout(paper, transactionType) {
  if (transactionType === 'sales_invoice') return buildTaxInvoiceLayout(paper);

  const profile = resolveProfile(transactionType);
  const elements = [
    logo('el_logo', W - 36, 2, 34, 22),
    dyn('el_co', 'Company', 'companyName', 0, 2, 118, 8, { fontSizePt: 15, fontWeight: 'bold' }),
    dyn('el_addr', 'Address', 'companyAddress', 0, 10, 118, 10, { fontSizePt: 9 }),
    dyn('el_phone', 'Phone', 'companyPhone', 0, 20, 118, 5, { fontSizePt: 9 }),
    dyn('el_gst', 'GSTIN', 'companyGstState', 0, 26, 118, 6, { fontSizePt: 9 }),
    hline('el_rule1', 0, 33, W),
    dyn('el_title', 'Document title', 'documentTitle', 0, 35, W, 9, { fontSizePt: 20, fontWeight: 'bold', textAlign: 'center', foreground: BRAND }),
    hline('el_rule2', 0, 45, W),
    lbl('el_h_party', profile.partyHeader, 0, 47, 58, 5, { fontWeight: 'bold' }),
    dyn('el_party', profile.partyHeader, profile.partyKey, 0, 52, 58, 6, { fontSizePt: 11, fontWeight: 'bold' }),
    dyn('el_party_det', 'Party details', profile.partyDetailsKey, 0, 58, 58, 10, { fontSizePt: 9 }),
    box('el_party_box', 0, 45, 60, 26),
    lbl('el_h_doc', 'Document Details', 122, 47, 68, 5, { fontWeight: 'bold' }),
    lbl('el_l_docno', profile.docNoLabel, 122, 52, 32, 4),
    dyn('el_docno', 'Document number', 'invoiceNo', 154, 52, 36, 6, { fontSizePt: 10, fontWeight: 'bold', textAlign: 'right' }),
    lbl('el_l_date', 'Date :', 122, 58, 32, 4),
    dyn('el_date', 'Date', 'invoiceDate', 154, 58, 36, 6, { fontSizePt: 10, textAlign: 'right' }),
    lbl('el_l_pos', 'Place of supply:', 122, 64, 32, 4),
    dyn('el_pos', 'Place of supply', 'placeOfSupply', 122, 68, 68, 5, { fontSizePt: 9 }),
    hline('el_rule3', 0, 76, W),
    dataTable('el_items', 0, 78, W, profile.tableHeight, tableColumns(profile), profile.showTotals)
  ];

  const footerY = 78 + profile.tableHeight + 4;
  if (profile.footer === 'full') elements.push(...fullFooter(footerY));
  else if (profile.footer === 'total') elements.push(...grandFooter(footerY));

  return {
    schemaVersion: LAYOUT_SCHEMA_VERSION,
    page: pageBlock(paper),
    theme: { fontFamily: 'Segoe UI', baseFontSizePt: 10, primaryColor: BRAND, textColor: '#0f172a', borderColor: '#94a3b8' },
    options: { showLogo: true, showGst: true, showAmountInWords: true, watermark: 'original' },
    elements
  };
}

function resolveProfile(tx) {
  const isPurchase = tx.startsWith('purchase') || tx === 'grn';
  const partyHeader = isPurchase && tx !== 'grn' ? 'Supplier' : isPurchase ? 'Supplier' : 'Bill To';
  const partyKey = isPurchase ? 'supplierName' : 'customerName';
  const partyDetailsKey = isPurchase ? 'supplierDetails' : 'customerDetails';
  const docNoLabel = docLabel(tx);

  if (tx === 'delivery_challan') {
    return { partyHeader, partyKey, partyDetailsKey, docNoLabel, isGrn: false, tableHeight: 110, showTotals: true, footer: 'none' };
  }
  if (tx === 'grn') {
    return { partyHeader: 'Supplier', partyKey: 'supplierName', partyDetailsKey: 'supplierDetails', docNoLabel: 'GRN No.', isGrn: true, tableHeight: 95, showTotals: true, footer: 'total' };
  }
  if (tx === 'sales_order' || tx === 'purchase_order') {
    return { partyHeader, partyKey, partyDetailsKey, docNoLabel, isGrn: false, tableHeight: 95, showTotals: true, footer: 'total' };
  }
  return { partyHeader, partyKey, partyDetailsKey, docNoLabel, isGrn: false, tableHeight: 88, showTotals: true, footer: 'full' };
}

function docLabel(tx) {
  if (tx === 'sales_order' || tx === 'purchase_order') return 'Order No.';
  if (tx === 'delivery_challan') return 'Challan No.';
  if (tx === 'sales_return' || tx === 'purchase_return') return 'Return No.';
  if (tx === 'grn') return 'GRN No.';
  return 'Invoice No.';
}

function tableColumns(profile) {
  if (profile.isGrn) {
    return [
      col('srNo', '#', 8, 'center'), col('itemCode', 'Code', 16), col('description', 'Description', 40),
      col('orderedQty', 'Ordered', 16, 'right'), col('receivedQty', 'Received', 16, 'right'), col('amount', 'Amount', 22, 'right')
    ];
  }
  if (profile.footer === 'full') {
    return [
      col('srNo', '#', 8, 'center'), col('description', 'Item name', 42), col('hsnCode', 'HSN/ SAC', 14),
      col('qty', 'Qty', 14, 'right'), col('unit', 'Unit', 10, 'center'), col('rate', 'Rate', 18, 'right'), col('amount', 'Amount', 22, 'right')
    ];
  }
  return [
    col('srNo', '#', 8, 'center'), col('itemCode', 'Code', 16), col('description', 'Description', 44),
    col('qty', 'Qty', 14, 'right'), col('rate', 'Rate', 18, 'right'), col('amount', 'Amount', 22, 'right')
  ];
}

function grandFooter(y) {
  return [
    hline('el_rule_total', 0, y, W),
    lbl('el_l_total', 'Grand Total', 108, y + 2, 40, 6, { fontWeight: 'bold' }),
    dyn('el_total', 'Grand Total', 'grandTotal', 148, y + 2, 42, 8, { fontSizePt: 12, fontWeight: 'bold', textAlign: 'right' })
  ];
}

function fullFooter(y) {
  return [
    lbl('el_l_words', 'Amount in Words:', 0, y, 95, 5, { fontWeight: 'bold' }),
    dyn('el_words', 'Amount in words', 'amountInWords', 0, y + 5, 95, 10, { fontSizePt: 9 }),
    lbl('el_h_terms', 'Terms and Conditions', 0, y + 16, 95, 5, { fontWeight: 'bold' }),
    dyn('el_terms', 'Terms', 'termsAndConditions', 0, y + 21, 95, 18, { fontSizePt: 8 }),
    lbl('el_l_sub', 'Sub Total', 108, y, 38, 5),
    dyn('el_sub', 'Sub Total', 'subTotal', 148, y, 42, 6, { fontSizePt: 10, textAlign: 'right' }),
    lbl('el_l_disc', 'Discount', 108, y + 6, 38, 5),
    dyn('el_disc', 'Discount', 'discountAmount', 148, y + 6, 42, 6, { fontSizePt: 10, textAlign: 'right' }),
    lbl('el_l_net', 'Total', 108, y + 12, 38, 6, { fontWeight: 'bold' }),
    dyn('el_net', 'Total', 'grandTotal', 148, y + 12, 42, 7, { fontSizePt: 12, fontWeight: 'bold', textAlign: 'right' }),
    lbl('el_l_recv', 'Received', 108, y + 19, 38, 5),
    dyn('el_recv', 'Received', 'receivedAmount', 148, y + 19, 42, 6, { fontSizePt: 10, textAlign: 'right' }),
    lbl('el_l_bal', 'Balance', 108, y + 25, 38, 5),
    dyn('el_bal', 'Balance', 'balanceAmount', 148, y + 25, 42, 6, { fontSizePt: 10, textAlign: 'right' }),
    hline('el_rule_bank', 0, y + 32, W),
    lbl('el_h_bank', 'Bank Details', 0, y + 34, 40, 5, { fontWeight: 'bold' }),
    dyn('el_bank', 'Bank', 'bankDetails', 0, y + 39, W, 16, { fontSizePt: 9 })
  ];
}

function pageBlock(paper) {
  return {
    paperSizeKey: paper?.key ?? 'A4_PORTRAIT',
    orientation: paper?.orientation ?? 'portrait',
    widthMm: paper?.widthMm ?? 210,
    heightMm: paper?.heightMm ?? 297,
    marginsMm: paper?.marginsMm ?? { top: 10, right: 10, bottom: 10, left: 10 }
  };
}

function dyn(id, name, fieldKey, x, y, w, h, style = {}) {
  return { id, type: 'dynamicText', name, xMm: x, yMm: y, widthMm: w, heightMm: h, zIndex: 2, visible: true, style: { fontFamily: 'Segoe UI', ...style }, binding: { fieldKey, token: `{{${fieldKey}}}` } };
}
function lbl(id, text, x, y, w, h, style = {}) {
  return { id, type: 'text', name: text, xMm: x, yMm: y, widthMm: w, heightMm: h, zIndex: 1, visible: true, style: { fontFamily: 'Segoe UI', fontSizePt: 8, foreground: '#64748b', ...style }, binding: { value: text } };
}
function hline(id, x, y, w) {
  return { id, type: 'line', name: 'Line', xMm: x, yMm: y, widthMm: w, heightMm: 0.4, zIndex: 0, visible: true, style: { borderThicknessMm: 0.35 }, binding: {} };
}
function box(id, x, y, w, h) {
  return { id, type: 'rectangle', name: 'Panel', xMm: x, yMm: y, widthMm: w, heightMm: h, zIndex: 0, visible: true, style: { borderThicknessMm: 0.35, background: '#f8fafc' }, binding: {} };
}
function logo(id, x, y, w, h) {
  return { id, type: 'companyLogo', name: 'Company logo', xMm: x, yMm: y, widthMm: w, heightMm: h, zIndex: 4, visible: true, style: { fontSizePt: 18 }, binding: {} };
}
function col(key, header, widthMm, align = 'left') {
  return { key, header, widthMm, align, visible: true };
}
function dataTable(id, x, y, w, h, columns, showTotalsRow) {
  return {
    id, type: 'table', name: 'Item table', xMm: x, yMm: y, widthMm: w, heightMm: h, zIndex: 3, visible: true,
    binding: { fieldKey: 'itemTable', dataSource: 'lines' },
    table: { showHeader: true, showTotalsRow, rowHeightMm: 5.5, headerBackground: BRAND, headerForeground: '#ffffff', columns }
  };
}
