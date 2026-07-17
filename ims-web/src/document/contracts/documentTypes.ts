/** Aligns with IMS BillFormatTemplateService / ApiDocumentMapper doc keys. */
export type DocumentTypeKey =
  | 'sales_invoice'
  | 'purchase_invoice'
  | 'sales_order'
  | 'quotation'
  | 'delivery_challan'
  | 'sales_return'
  | 'purchase_order'
  | 'grn'
  | 'purchase_return';

export const DOCUMENT_TYPE_LABELS: Record<DocumentTypeKey, string> = {
  sales_invoice: 'Sales Invoice',
  purchase_invoice: 'Purchase Invoice',
  sales_order: 'Sales Order',
  quotation: 'Quotation',
  delivery_challan: 'Delivery Challan',
  sales_return: 'Sales Return',
  purchase_order: 'Purchase Order',
  grn: 'GRN',
  purchase_return: 'Purchase Return',
};
