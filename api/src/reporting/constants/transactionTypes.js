/** Supported document transaction types — extend by adding strings + seeds. */
export const TRANSACTION_TYPES = [
  { key: 'sales_invoice', label: 'Sales Invoice', category: 'sales', partyKind: 'customer' },
  { key: 'sales_order', label: 'Sales Order', category: 'sales', partyKind: 'customer' },
  { key: 'sales_return', label: 'Sales Return', category: 'sales', partyKind: 'customer' },
  { key: 'delivery_challan', label: 'Delivery Challan', category: 'sales', partyKind: 'customer' },
  { key: 'purchase_invoice', label: 'Purchase Invoice', category: 'purchase', partyKind: 'supplier' },
  { key: 'purchase_order', label: 'Purchase Order', category: 'purchase', partyKind: 'supplier' },
  { key: 'purchase_return', label: 'Purchase Return', category: 'purchase', partyKind: 'supplier' },
  { key: 'grn', label: 'GRN', category: 'purchase', partyKind: 'supplier' },
  // Future-ready (inactive until seeded)
  { key: 'quotation', label: 'Quotation', category: 'sales', partyKind: 'customer', future: true },
  { key: 'proforma_invoice', label: 'Proforma Invoice', category: 'sales', partyKind: 'customer', future: true },
  { key: 'credit_note', label: 'Credit Note', category: 'sales', partyKind: 'customer', future: true },
  { key: 'debit_note', label: 'Debit Note', category: 'sales', partyKind: 'customer', future: true },
  { key: 'material_issue', label: 'Material Issue', category: 'inventory', partyKind: 'none', future: true },
  { key: 'material_receipt', label: 'Material Receipt', category: 'inventory', partyKind: 'none', future: true },
  { key: 'stock_transfer', label: 'Stock Transfer', category: 'inventory', partyKind: 'none', future: true }
];

export function isKnownTransactionType(key) {
  return TRANSACTION_TYPES.some((t) => t.key === String(key ?? '').trim().toLowerCase());
}

export function partyKindForTransactionType(key) {
  return TRANSACTION_TYPES.find((t) => t.key === key)?.partyKind ?? 'customer';
}
