import { LAYOUT_SCHEMA_VERSION } from './layoutSchema.js';

const W = 190;
const MAROON = '#5c4033';
const LOGO_BLUE = '#1e3a8a';
const TABLE_Y = 76;
const TABLE_H = 118;
const FOOTER_Y = 198;

export function buildTaxInvoiceLayout(paper) {
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
      primaryColor: MAROON,
      textColor: '#0f172a',
      borderColor: '#94a3b8'
    },
    options: { showLogo: true, showGst: true, showAmountInWords: true, watermark: 'original' },
    elements: [
      logo('el_logo', W - 38, 2, 36, 24),
      dyn('el_co', 'Company', 'companyName', 0, 2, 120, 9, { fontSizePt: 16, fontWeight: 'bold' }),
      dyn('el_addr', 'Address', 'companyAddress', 0, 11, 120, 11, { fontSizePt: 9 }),
      dyn('el_phone', 'Phone', 'companyPhoneFormatted', 0, 22, 120, 5, { fontSizePt: 9 }),
      dyn('el_gst', 'GSTIN', 'companyGstState', 0, 28, 120, 6, { fontSizePt: 9 }),
      hline('el_rule1', 0, 34, W),
      dyn('el_title', 'Document title', 'documentTitle', 0, 36, W, 10, { fontSizePt: 22, fontWeight: 'bold', textAlign: 'center', foreground: MAROON }),
      hline('el_rule2', 0, 47, W),
      lbl('el_h_bill', 'Bill To', 0, 49, 58, 5, { fontWeight: 'bold' }),
      dyn('el_customer', 'Customer', 'customerName', 0, 54, 58, 7, { fontSizePt: 12, fontWeight: 'bold' }),
      lbl('el_l_contact', 'Contact No. :', 0, 61, 28, 4),
      dyn('el_contact', 'Contact', 'customerContact', 28, 61, 30, 5, { fontSizePt: 9 }),
      lbl('el_h_trans', 'Transportation Details', 60, 49, 58, 5, { fontWeight: 'bold' }),
      lbl('el_l_trans', 'Transport Name:', 60, 54, 58, 4),
      dyn('el_trans', 'Transport', 'transportName', 60, 58, 58, 6, { fontSizePt: 9 }),
      lbl('el_l_del', 'Delivery Location:', 60, 64, 58, 4),
      dyn('el_del', 'Delivery', 'deliveryLocation', 60, 68, 58, 10, { fontSizePt: 9 }),
      lbl('el_h_inv', 'Invoice Details', 122, 49, 68, 5, { fontWeight: 'bold' }),
      lbl('el_l_invno', 'Invoice No. :', 122, 54, 34, 4),
      dyn('el_invno', 'Invoice No', 'invoiceNo', 156, 54, 34, 6, { fontSizePt: 10, fontWeight: 'bold', textAlign: 'right' }),
      lbl('el_l_date', 'Date :', 122, 60, 34, 4),
      dyn('el_date', 'Date', 'invoiceDate', 156, 60, 34, 6, { fontSizePt: 10, textAlign: 'right' }),
      lbl('el_l_pos', 'Place of supply:', 122, 66, 34, 4),
      dyn('el_pos', 'Place of supply', 'placeOfSupply', 156, 66, 34, 5, { fontSizePt: 9, textAlign: 'right' }),
      hline('el_rule3', 0, 74, W),
      taxTable('el_items', 0, TABLE_Y, W, TABLE_H),
      lbl('el_l_words', 'Invoice Amount in Words', 0, FOOTER_Y, 98, 5, { fontWeight: 'bold' }),
      dyn('el_words', 'Amount in words', 'amountInWords', 0, FOOTER_Y + 5, 98, 8, { fontSizePt: 9 }),
      lbl('el_h_terms', 'Terms and Conditions', 0, FOOTER_Y + 14, 98, 5, { fontWeight: 'bold' }),
      dyn('el_terms', 'Terms', 'termsAndConditions', 0, FOOTER_Y + 19, 98, 28, { fontSizePt: 8 }),
      lbl('el_h_bank', 'Bank Details', 0, FOOTER_Y + 48, 98, 5, { fontWeight: 'bold' }),
      dyn('el_bank', 'Bank', 'bankDetailsFormatted', 0, FOOTER_Y + 53, 98, 22, { fontSizePt: 9 }),
      box('el_summary_box', 104, FOOTER_Y - 1, 86, 56),
      lbl('el_l_sub', 'Sub Total', 108, FOOTER_Y, 42, 5),
      dyn('el_sub', 'Sub Total', 'subTotal', 150, FOOTER_Y, 40, 6, { fontSizePt: 10, textAlign: 'right' }),
      dyn('el_l_disc', 'Discount label', 'discountLabel', 108, FOOTER_Y + 6, 42, 5, { fontSizePt: 9 }),
      dyn('el_disc', 'Discount', 'discountAmount', 150, FOOTER_Y + 6, 40, 6, { fontSizePt: 10, textAlign: 'right' }),
      lbl('el_l_net', 'Total', 108, FOOTER_Y + 12, 42, 6, { fontWeight: 'bold' }),
      dyn('el_net', 'Total', 'grandTotal', 150, FOOTER_Y + 12, 40, 8, { fontSizePt: 12, fontWeight: 'bold', textAlign: 'right' }),
      lbl('el_l_recv', 'Received', 108, FOOTER_Y + 19, 42, 5),
      dyn('el_recv', 'Received', 'receivedAmount', 150, FOOTER_Y + 19, 40, 6, { fontSizePt: 10, textAlign: 'right' }),
      lbl('el_l_bal', 'Balance', 108, FOOTER_Y + 25, 42, 5),
      dyn('el_bal', 'Balance', 'balanceAmount', 150, FOOTER_Y + 25, 40, 6, { fontSizePt: 10, textAlign: 'right' }),
      lbl('el_l_pbal', 'Previous Balance', 108, FOOTER_Y + 31, 42, 5),
      dyn('el_pbal', 'Previous Balance', 'previousBalance', 150, FOOTER_Y + 31, 40, 6, { fontSizePt: 10, textAlign: 'right' }),
      lbl('el_l_cbal', 'Current Balance', 108, FOOTER_Y + 37, 42, 5),
      dyn('el_cbal', 'Current Balance', 'currentBalance', 150, FOOTER_Y + 37, 40, 6, { fontSizePt: 10, textAlign: 'right' }),
      lbl('el_l_ep', 'Earned Points', 108, FOOTER_Y + 43, 42, 5),
      dyn('el_ep', 'Earned Points', 'earnedPoints', 150, FOOTER_Y + 43, 40, 6, { fontSizePt: 10, textAlign: 'right' }),
      lbl('el_l_ap', 'Available Points', 108, FOOTER_Y + 49, 42, 5),
      dyn('el_ap', 'Available Points', 'availablePoints', 150, FOOTER_Y + 49, 40, 6, { fontSizePt: 10, textAlign: 'right' })
    ]
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
  return { id, type: 'rectangle', name: 'Summary panel', xMm: x, yMm: y, widthMm: w, heightMm: h, zIndex: 1, visible: true, style: { borderThicknessMm: 0.35, background: '#ffffff', borderColor: '#0f172a' }, binding: {} };
}
function logo(id, x, y, w, h) {
  return { id, type: 'companyLogo', name: 'Company logo', xMm: x, yMm: y, widthMm: w, heightMm: h, zIndex: 4, visible: true, style: { fontSizePt: 20, background: LOGO_BLUE, foreground: '#ffffff' }, binding: {} };
}
function col(key, header, widthMm, align = 'left') {
  return { key, header, widthMm, align, visible: true };
}
function taxTable(id, x, y, w, h) {
  return {
    id, type: 'table', name: 'Item table', xMm: x, yMm: y, widthMm: w, heightMm: h, zIndex: 3, visible: true,
    binding: { fieldKey: 'itemTable', dataSource: 'lines' },
    table: {
      showHeader: true, showTotalsRow: true, rowHeightMm: 5.5, headerBackground: MAROON, headerForeground: '#ffffff',
      columns: [
        col('srNo', '#', 8, 'center'), col('description', 'Item name', 42), col('hsnCode', 'HSN/ SAC', 15),
        col('colour', 'COLOUR', 13), col('size', 'Size', 11), col('qty', 'Quantity', 14, 'right'),
        col('unit', 'Unit', 10, 'center'), col('rate', 'Price/ Unit', 19, 'right'), col('amount', 'Amount', 22, 'right')
      ]
    }
  };
}
