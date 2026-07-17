import { buildProfessionalLayout } from './professionalLayout.js';
import { buildTaxInvoiceLayout } from './taxInvoiceLayout.js';

const CONTENT_WIDTH = 190;

export function defaultSalesInvoiceLayout(paper) {
  return buildTaxInvoiceLayout(paper);
}

export function defaultPurchaseLayout(paper) {
  return buildProfessionalLayout(paper, 'purchase_invoice');
}

function orderNoLabel(transactionType) {
  if (transactionType === 'sales_order' || transactionType === 'purchase_order') return 'Order No.';
  if (transactionType === 'delivery_challan') return 'Challan No.';
  if (transactionType === 'sales_return' || transactionType === 'purchase_return') return 'Return No.';
  if (transactionType === 'grn') return 'GRN No.';
  return 'Invoice No.';
}

function buildStandardLayout(paper, { isPurchase, isGrn, transactionType }) {
  const partyKey = isPurchase ? 'supplierName' : 'customerName';
  const partyDetailsKey = isPurchase ? 'supplierDetails' : 'customerDetails';
  const partyLabel = isPurchase ? 'Supplier' : 'Customer';
  const docNoLabel = orderNoLabel(transactionType);

  return {
    schemaVersion: LAYOUT_SCHEMA_VERSION,
    page: {
      paperSizeKey: paper?.key ?? 'A4_PORTRAIT',
      orientation: paper?.orientation ?? 'portrait',
      widthMm: paper?.widthMm ?? 210,
      heightMm: paper?.heightMm ?? 297,
      marginsMm: paper?.marginsMm ?? { top: 10, right: 10, bottom: 10, left: 10 }
    },
    theme: {
      fontFamily: 'Segoe UI',
      baseFontSizePt: 10,
      primaryColor: '#1e293b',
      textColor: '#0f172a',
      borderColor: '#334155'
    },
    options: { showLogo: true, showGst: true, showAmountInWords: true, watermark: 'original' },
    elements: [
      el('dynamicText', 'Document title', 'documentTitle', 0, 4, CONTENT_WIDTH, 10, { fontSizePt: 18, fontWeight: 'bold', textAlign: 'center', zIndex: 2 }),
      hline('el_rule_top', 0, 15, CONTENT_WIDTH),
      el('dynamicText', 'Company', 'companyName', 0, 17, 115, 7, { fontSizePt: 13, fontWeight: 'bold', zIndex: 2 }),
      el('dynamicText', 'Address', 'companyAddress', 0, 24, 115, 12, { fontSizePt: 9, zIndex: 2 }),
      el('dynamicText', 'GSTIN', 'gstin', 0, 37, 115, 5, { fontSizePt: 9, zIndex: 2 }),
      vline('el_rule_mid', 118, 17, 28),
      label('el_lbl_doc', docNoLabel, 120, 17, 28, 5),
      el('dynamicText', 'Document number', 'invoiceNo', 148, 17, 42, 6, { fontSizePt: 10, fontWeight: 'bold', textAlign: 'right', zIndex: 2 }),
      label('el_lbl_date', 'Date', 120, 24, 28, 5),
      el('dynamicText', 'Document date', 'invoiceDate', 148, 24, 42, 6, { fontSizePt: 10, textAlign: 'right', zIndex: 2 }),
      hline('el_rule_party', 0, 44, CONTENT_WIDTH),
      label('el_lbl_party', partyLabel, 0, 47, 22, 5, { fontWeight: 'bold' }),
      box('el_party_box', 0, 45, 118, 26),
      el('dynamicText', partyLabel, partyKey, 0, 52, 115, 6, { fontSizePt: 11, fontWeight: 'bold', zIndex: 2 }),
      el('dynamicText', 'Party details', partyDetailsKey, 0, 59, 115, 10, { fontSizePt: 9, zIndex: 2 }),
      tableEl(0, 74, CONTENT_WIDTH, 108, isGrn),
      hline('el_rule_total', 95, 186, 95),
      label('el_lbl_total', 'Grand Total', 95, 188, 40, 6, { fontWeight: 'bold' }),
      el('dynamicText', 'Grand Total', 'grandTotal', 138, 188, 52, 7, { fontSizePt: 12, fontWeight: 'bold', textAlign: 'right', zIndex: 2 })
    ]
  };
}

function el(type, name, fieldKey, xMm, yMm, widthMm, heightMm, style = {}) {
  const { zIndex = 2, ...rest } = style;
  return {
    id: `el_${fieldKey}`,
    type,
    name,
    xMm,
    yMm,
    widthMm,
    heightMm,
    zIndex,
    visible: true,
    style: { fontFamily: 'Segoe UI', ...rest },
    binding: type === 'text' ? { value: name } : { fieldKey, token: `{{${fieldKey}}}` }
  };
}

function label(id, text, xMm, yMm, widthMm, heightMm, style = {}) {
  return {
    id,
    type: 'text',
    name: text,
    xMm,
    yMm,
    widthMm,
    heightMm,
    zIndex: 1,
    visible: true,
    style: { fontFamily: 'Segoe UI', fontSizePt: 8, foreground: '#64748b', ...style },
    binding: { value: text }
  };
}

function hline(id, xMm, yMm, widthMm) {
  return {
    id,
    type: 'line',
    name: 'Line',
    xMm,
    yMm,
    widthMm,
    heightMm: 1,
    zIndex: 0,
    visible: true,
    style: { borderThicknessMm: 0.4 },
    binding: {}
  };
}

function vline(id, xMm, yMm, heightMm) {
  return {
    id,
    type: 'line',
    name: 'Line',
    xMm,
    yMm,
    widthMm: 1,
    heightMm,
    zIndex: 0,
    visible: true,
    style: { borderThicknessMm: 0.4 },
    binding: {}
  };
}

function box(id, xMm, yMm, widthMm, heightMm) {
  return {
    id,
    type: 'rectangle',
    name: 'Party box',
    xMm,
    yMm,
    widthMm,
    heightMm,
    zIndex: 0,
    visible: true,
    style: { borderThicknessMm: 0.35, background: '#f8fafc' },
    binding: {}
  };
}

function tableEl(xMm, yMm, widthMm, heightMm, isGrn) {
  const cols = isGrn
    ? [
        { key: 'srNo', header: 'Sr', widthMm: 10, align: 'center', visible: true },
        { key: 'itemCode', header: 'Code', widthMm: 20, visible: true },
        { key: 'description', header: 'Description', widthMm: 42, visible: true },
        { key: 'orderedQty', header: 'Ordered', widthMm: 18, align: 'right', visible: true },
        { key: 'receivedQty', header: 'Received', widthMm: 18, align: 'right', visible: true },
        { key: 'amount', header: 'Amount', widthMm: 22, align: 'right', visible: true }
      ]
    : [
        { key: 'srNo', header: 'Sr', widthMm: 10, align: 'center', visible: true },
        { key: 'itemCode', header: 'Code', widthMm: 18, visible: true },
        { key: 'description', header: 'Description', widthMm: 48, visible: true },
        { key: 'qty', header: 'Qty', widthMm: 16, align: 'right', visible: true },
        { key: 'rate', header: 'Rate', widthMm: 20, align: 'right', visible: true },
        { key: 'amount', header: 'Amount', widthMm: 24, align: 'right', visible: true }
      ];

  return {
    id: 'el_itemTable',
    type: 'table',
    name: 'Item table',
    xMm,
    yMm,
    widthMm,
    heightMm,
    zIndex: 3,
    visible: true,
    binding: { fieldKey: 'itemTable', dataSource: 'lines' },
    table: { showHeader: true, rowHeightMm: 6, columns: cols }
  };
}

export function layoutForTransaction(tx, paper) {
  return buildProfessionalLayout(paper, tx);
}
