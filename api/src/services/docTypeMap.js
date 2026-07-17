export const DOC_PREFIX = {
  quotation: 'QT',
  sales_order: 'SO',
  delivery_challan: 'DC',
  sales_invoice: 'INV',
  sales_return: 'SR',
  purchase_order: 'PO',
  grn: 'GRN',
  purchase_invoice: 'PI',
  purchase_return: 'PR'
};

export const DOC_INITIAL = {
  quotation: 1200,
  sales_order: 2640,
  delivery_challan: 1200,
  sales_invoice: 5500,
  sales_return: 301,
  purchase_order: 1040,
  grn: 880,
  purchase_invoice: 2200,
  purchase_return: 101
};

export function formatDocNo(docType, docNo) {
  const prefix = DOC_PREFIX[docType] || 'DOC';
  return `${prefix}-${docNo}`;
}
