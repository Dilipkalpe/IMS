/**
 * Bill Format Designer — dynamic catalog (transaction types, fields, columns, paper).
 * Add new transaction types here without changing designer/print core code.
 */

export const LAYOUT_VERSION = 2;

export const PAPER_PRESETS = [
  { key: 'A4_PORTRAIT', label: 'A4 Portrait', sizeKey: 'A4', widthMm: 210, heightMm: 297, orientation: 'portrait' },
  { key: 'A4_LANDSCAPE', label: 'A4 Landscape', sizeKey: 'A4', widthMm: 297, heightMm: 210, orientation: 'landscape' },
  { key: 'A5_PORTRAIT', label: 'A5 Portrait', sizeKey: 'A5', widthMm: 148, heightMm: 210, orientation: 'portrait' },
  { key: 'A5_LANDSCAPE', label: 'A5 Landscape', sizeKey: 'A5', widthMm: 210, heightMm: 148, orientation: 'landscape' },
  { key: 'LETTER', label: 'Letter Size', sizeKey: 'Letter', widthMm: 216, heightMm: 279, orientation: 'portrait' },
  { key: 'THERMAL_58', label: 'Thermal 58mm', sizeKey: 'Thermal58', widthMm: 58, heightMm: 297, orientation: 'portrait' },
  { key: 'THERMAL_80', label: 'Thermal 80mm', sizeKey: 'Thermal80', widthMm: 80, heightMm: 297, orientation: 'portrait' },
  { key: 'CUSTOM', label: 'Custom Paper Size', sizeKey: 'Custom', widthMm: 210, heightMm: 297, orientation: 'portrait' }
];

export const WATERMARK_TYPES = [
  'original',
  'duplicate',
  'triplicate',
  'office_copy',
  'customer_copy',
  'supplier_copy'
];

const salesDocTypes = ['sales_invoice', 'sales_order', 'sales_return', 'delivery_challan'];
const purchaseDocTypes = ['purchase_invoice', 'purchase_order', 'purchase_return', 'grn'];

export const TRANSACTION_TYPES = [
  {
    key: 'sales_invoice',
    label: 'Sales Invoice',
    category: 'sales',
    defaultTitle: 'TAX INVOICE',
    docTypes: ['sales_invoice'],
    partyKind: 'customer',
    assignmentField: 'salesInvoice'
  },
  {
    key: 'sales_order',
    label: 'Sales Order',
    category: 'sales',
    defaultTitle: 'SALES ORDER',
    docTypes: ['sales_order'],
    partyKind: 'customer',
    assignmentField: 'salesOrder'
  },
  {
    key: 'sales_return',
    label: 'Sales Return',
    category: 'sales',
    defaultTitle: 'SALES RETURN',
    docTypes: ['sales_return'],
    partyKind: 'customer',
    assignmentField: 'salesReturn'
  },
  {
    key: 'delivery_challan',
    label: 'Delivery Challan',
    category: 'sales',
    defaultTitle: 'DELIVERY CHALLAN',
    docTypes: ['delivery_challan'],
    partyKind: 'customer',
    assignmentField: 'deliveryChallan'
  },
  {
    key: 'purchase_invoice',
    label: 'Purchase Invoice',
    category: 'purchase',
    defaultTitle: 'PURCHASE INVOICE',
    docTypes: ['purchase_invoice'],
    partyKind: 'supplier',
    assignmentField: 'purchaseInvoice'
  },
  {
    key: 'purchase_order',
    label: 'Purchase Order',
    category: 'purchase',
    defaultTitle: 'PURCHASE ORDER',
    docTypes: ['purchase_order'],
    partyKind: 'supplier',
    assignmentField: 'purchaseOrder'
  },
  {
    key: 'purchase_return',
    label: 'Purchase Return',
    category: 'purchase',
    defaultTitle: 'PURCHASE RETURN',
    docTypes: ['purchase_return'],
    partyKind: 'supplier',
    assignmentField: 'purchaseReturn'
  },
  {
    key: 'grn',
    label: 'GRN (Goods Receipt Note)',
    category: 'purchase',
    defaultTitle: 'GOODS RECEIPT NOTE',
    docTypes: ['grn'],
    partyKind: 'supplier',
    assignmentField: 'grn'
  }
];

export const HEADER_CONTROLS = [
  { key: 'companyLogo', type: 'companyLogo', label: 'Company Logo', group: 'header' },
  { key: 'companyName', type: 'companyDetails', label: 'Company Name', group: 'header', token: '{{companyName}}' },
  { key: 'companyAddress', type: 'companyDetails', label: 'Company Address', group: 'header' },
  { key: 'companyGstin', type: 'companyDetails', label: 'GSTIN', group: 'header' },
  { key: 'companyPan', type: 'companyDetails', label: 'PAN', group: 'header' },
  { key: 'companyPhone', type: 'companyDetails', label: 'Contact Number', group: 'header' },
  { key: 'companyEmail', type: 'companyDetails', label: 'Email', group: 'header' },
  { key: 'companyWebsite', type: 'companyDetails', label: 'Website', group: 'header' }
];

export const DOCUMENT_CONTROLS = [
  { key: 'documentTitle', type: 'header', label: 'Document Title', token: '{{documentTitle}}' },
  { key: 'documentNumber', type: 'field', label: 'Document Number', token: '{{documentNumber}}' },
  { key: 'documentDate', type: 'field', label: 'Document Date', token: '{{documentDate}}' },
  { key: 'dueDate', type: 'field', label: 'Due Date', token: '{{dueDate}}' },
  { key: 'referenceNumber', type: 'field', label: 'Reference Number', token: '{{referenceNumber}}' },
  { key: 'vendorBillNumber', type: 'field', label: 'Vendor Bill Number', token: '{{vendorBillNumber}}' },
  { key: 'vendorBillDate', type: 'field', label: 'Vendor Bill Date', token: '{{vendorBillDate}}' },
  { key: 'customerPoNumber', type: 'field', label: 'Customer PO Number', token: '{{customerPoNumber}}' },
  { key: 'supplierPoNumber', type: 'field', label: 'Supplier PO Number', token: '{{supplierPoNumber}}' },
  { key: 'deliveryDate', type: 'field', label: 'Delivery Date', token: '{{deliveryDate}}' }
];

export const PARTY_CONTROLS = {
  customer: [
    { key: 'customerName', type: 'customerDetails', label: 'Customer Name' },
    { key: 'billingAddress', type: 'customerDetails', label: 'Billing Address' },
    { key: 'shippingAddress', type: 'customerDetails', label: 'Shipping Address' },
    { key: 'customerGstin', type: 'customerDetails', label: 'GSTIN' },
    { key: 'customerMobile', type: 'customerDetails', label: 'Mobile Number' },
    { key: 'customerState', type: 'customerDetails', label: 'State' },
    { key: 'placeOfSupply', type: 'customerDetails', label: 'Place of Supply' }
  ],
  supplier: [
    { key: 'supplierName', type: 'supplierDetails', label: 'Supplier Name' },
    { key: 'supplierAddress', type: 'supplierDetails', label: 'Supplier Address' },
    { key: 'supplierGstin', type: 'supplierDetails', label: 'Supplier GSTIN' },
    { key: 'supplierPhone', type: 'supplierDetails', label: 'Supplier Contact' },
    { key: 'supplierEmail', type: 'supplierDetails', label: 'Supplier Email' }
  ]
};

export const ITEM_COLUMNS = [
  { key: 'srNo', header: 'Sr No', align: 'center', width: 36 },
  { key: 'itemCode', header: 'Item Code', align: 'left', width: 72 },
  { key: 'itemName', header: 'Item Name', align: 'left', width: 120 },
  { key: 'description', header: 'Description', align: 'left', width: 140 },
  { key: 'hsnCode', header: 'HSN Code', align: 'center', width: 56 },
  { key: 'batchNo', header: 'Batch No', align: 'left', width: 64 },
  { key: 'serialNo', header: 'Serial No', align: 'left', width: 64 },
  { key: 'qty', header: 'Qty', align: 'right', width: 48 },
  { key: 'orderedQty', header: 'Ordered Qty', align: 'right', width: 56 },
  { key: 'receivedQty', header: 'Received Qty', align: 'right', width: 56 },
  { key: 'acceptedQty', header: 'Accepted Qty', align: 'right', width: 56 },
  { key: 'rejectedQty', header: 'Rejected Qty', align: 'right', width: 56 },
  { key: 'pendingQty', header: 'Pending Qty', align: 'right', width: 56 },
  { key: 'unit', header: 'Unit', align: 'center', width: 40 },
  { key: 'rate', header: 'Rate', align: 'right', width: 56 },
  { key: 'discount', header: 'Discount %', align: 'right', width: 48 },
  { key: 'discountAmount', header: 'Discount Amount', align: 'right', width: 64 },
  { key: 'gstPercent', header: 'Tax %', align: 'right', width: 48 },
  { key: 'taxAmount', header: 'Tax Amount', align: 'right', width: 64 },
  { key: 'amount', header: 'Amount', align: 'right', width: 64 }
];

export const FOOTER_CONTROLS = [
  { key: 'totalQty', type: 'footer', label: 'Total Quantity' },
  { key: 'taxableAmount', type: 'taxDetails', label: 'Taxable Amount' },
  { key: 'cgst', type: 'taxDetails', label: 'CGST' },
  { key: 'sgst', type: 'taxDetails', label: 'SGST' },
  { key: 'igst', type: 'taxDetails', label: 'IGST' },
  { key: 'roundOff', type: 'taxDetails', label: 'Round Off' },
  { key: 'grandTotal', type: 'taxDetails', label: 'Grand Total' },
  { key: 'amountInWords', type: 'footer', label: 'Amount In Words' },
  { key: 'bankDetails', type: 'footer', label: 'Bank Details' },
  { key: 'qrCode', type: 'footer', label: 'QR Code' },
  { key: 'terms', type: 'termsAndConditions', label: 'Terms & Conditions' },
  { key: 'authorizedSignature', type: 'footer', label: 'Authorized Signature' },
  { key: 'customerSignature', type: 'footer', label: 'Customer Signature' },
  { key: 'supplierSignature', type: 'footer', label: 'Supplier Signature' },
  { key: 'receiverSignature', type: 'footer', label: 'Receiver Signature' }
];

/** Transaction-specific document fields (metadata panel + tokens). */
export const TRANSACTION_FIELDS = {
  sales_invoice: [
    { key: 'paymentTerms', label: 'Payment Terms', token: '{{paymentTerms}}' },
    { key: 'outstandingAmount', label: 'Outstanding Amount', token: '{{outstandingAmount}}' },
    { key: 'ewayBillNo', label: 'E-way Bill No', token: '{{ewayBillNo}}' },
    { key: 'ewayBillDate', label: 'E-way Bill Date', token: '{{ewayBillDate}}' },
    { key: 'vehicleNumber', label: 'Vehicle Number', token: '{{vehicleNumber}}' },
    { key: 'transporterName', label: 'Transporter Name', token: '{{transporterName}}' },
    { key: 'transporterId', label: 'Transporter ID', token: '{{transporterId}}' },
    { key: 'distanceKm', label: 'Distance (Km)', token: '{{distanceKm}}' }
  ],
  sales_order: [
    { key: 'salesPerson', label: 'Sales Person', token: '{{salesPerson}}' },
    { key: 'customerPoNumber', label: 'Customer PO Number', token: '{{customerPoNumber}}' }
  ],
  sales_return: [
    { key: 'originalInvoiceNumber', label: 'Original Invoice Number', token: '{{originalInvoiceNumber}}' },
    { key: 'returnReason', label: 'Return Reason', token: '{{returnReason}}' }
  ],
  delivery_challan: [
    { key: 'vehicleNumber', label: 'Vehicle Number', token: '{{vehicleNumber}}' },
    { key: 'transporterName', label: 'Transporter Name', token: '{{transporterName}}' },
    { key: 'dispatchFrom', label: 'Dispatch From', token: '{{dispatchFrom}}' },
    { key: 'dispatchTo', label: 'Dispatch To', token: '{{dispatchTo}}' }
  ],
  purchase_invoice: [
    { key: 'supplierBillNumber', label: 'Supplier Bill Number', token: '{{supplierBillNumber}}' },
    { key: 'supplierBillDate', label: 'Supplier Bill Date', token: '{{supplierBillDate}}' },
    { key: 'paymentTerms', label: 'Payment Terms', token: '{{paymentTerms}}' }
  ],
  purchase_order: [
    { key: 'supplierPoReference', label: 'Supplier PO Reference', token: '{{supplierPoReference}}' },
    { key: 'expectedDeliveryDate', label: 'Expected Delivery Date', token: '{{expectedDeliveryDate}}' },
    { key: 'buyerName', label: 'Buyer Name', token: '{{buyerName}}' }
  ],
  purchase_return: [
    { key: 'originalPurchaseInvoiceNumber', label: 'Original Purchase Invoice', token: '{{originalPurchaseInvoiceNumber}}' },
    { key: 'returnReason', label: 'Return Reason', token: '{{returnReason}}' },
    { key: 'supplierReference', label: 'Supplier Reference', token: '{{supplierReference}}' }
  ],
  grn: [
    { key: 'purchaseOrderNumber', label: 'Purchase Order Number', token: '{{purchaseOrderNumber}}' },
    { key: 'receivedBy', label: 'Received By', token: '{{receivedBy}}' },
    { key: 'vehicleNumber', label: 'Vehicle Number', token: '{{vehicleNumber}}' },
    { key: 'gateEntryNumber', label: 'Gate Entry Number', token: '{{gateEntryNumber}}' },
    { key: 'warehouseName', label: 'Warehouse Name', token: '{{warehouseName}}' }
  ]
};

/** Default visible columns per transaction type. */
export const DEFAULT_COLUMNS_BY_TRANSACTION = {
  sales_invoice: ['srNo', 'itemCode', 'description', 'hsnCode', 'qty', 'unit', 'rate', 'discount', 'gstPercent', 'amount'],
  sales_order: ['srNo', 'itemCode', 'description', 'qty', 'unit', 'rate', 'amount'],
  sales_return: ['srNo', 'itemCode', 'description', 'qty', 'rate', 'amount'],
  delivery_challan: ['srNo', 'itemCode', 'description', 'qty', 'unit'],
  purchase_invoice: ['srNo', 'itemCode', 'description', 'hsnCode', 'qty', 'unit', 'rate', 'gstPercent', 'amount'],
  purchase_order: ['srNo', 'itemCode', 'description', 'qty', 'unit', 'rate', 'amount'],
  purchase_return: ['srNo', 'itemCode', 'description', 'qty', 'rate', 'amount'],
  grn: ['srNo', 'itemCode', 'description', 'orderedQty', 'receivedQty', 'acceptedQty', 'rejectedQty', 'pendingQty', 'unit']
};

export const DEFAULT_VISIBILITY = {
  showLogo: true,
  showGst: true,
  showDiscount: true,
  showTaxBreakup: true,
  showBankDetails: true,
  showQrCode: false,
  showSignature: true,
  showRate: true,
  showAmountInWords: true,
  showSupplierInfo: true,
  showCustomerInfo: true
};

export const DEFAULT_PRINT_SETTINGS = {
  autoPrintAfterSave: false,
  printPreview: true,
  numberOfCopies: 1,
  watermark: 'original'
};

export function getTransactionType(key) {
  return TRANSACTION_TYPES.find((t) => t.key === key) ?? null;
}

export function getCatalogPayload() {
  return {
    layoutVersion: LAYOUT_VERSION,
    paperPresets: PAPER_PRESETS,
    watermarkTypes: WATERMARK_TYPES,
    transactionTypes: TRANSACTION_TYPES,
    headerControls: HEADER_CONTROLS,
    documentControls: DOCUMENT_CONTROLS,
    partyControls: PARTY_CONTROLS,
    itemColumns: ITEM_COLUMNS,
    footerControls: FOOTER_CONTROLS,
    transactionFields: TRANSACTION_FIELDS,
    defaultVisibility: DEFAULT_VISIBILITY,
    defaultPrintSettings: DEFAULT_PRINT_SETTINGS,
    defaultColumnsByTransaction: DEFAULT_COLUMNS_BY_TRANSACTION
  };
}

export function columnsForTransaction(transactionType) {
  const keys = DEFAULT_COLUMNS_BY_TRANSACTION[transactionType] ?? DEFAULT_COLUMNS_BY_TRANSACTION.sales_invoice;
  return ITEM_COLUMNS.filter((c) => keys.includes(c.key)).map((c) => ({
    ...c,
    visible: true
  }));
}
