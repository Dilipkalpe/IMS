/** Document print/export — public API for transaction screens. */

export type { DocumentTypeKey } from './contracts/documentTypes';
export type { PrintableDocumentV1, PrintableLineV1, PrintableTotalsV1 } from './contracts/printableDocument';
export type { BillFormatKey, BillFormatDefinition, BillFormatSummary } from './contracts/billFormat';
export type {
  DocumentActionOutcome,
  ExportTarget,
  ListExportRequest,
  PrintRequest,
} from './contracts/printExportRequests';

export type { PrintProvider, BillFormatProvider, ExportProvider, DocumentPrintProviders } from './providers/types';

export { DocumentPrintService, documentPrintService, defaultDocumentPrintProviders } from './providers/documentPrintService';
export { apiDocumentPrintProviders } from './providers/apiDocumentPrintProviders';
export { apiBillFormatProvider } from './providers/apiBillFormatProvider';
export { invalidateSalesBillTemplateCache } from '../api/salesBillTemplates';
export type { BillLayoutJson, BillFormatVisibilityRules } from './contracts/billLayout';
export { mapSalesInvoiceToPrintableDocument } from './mappers/salesInvoicePrintMapper';
export type { SalesInvoiceUiSnapshot } from './mappers/salesInvoicePrintMapper';

export { DocumentPrintProvider, useDocumentPrintService } from './context/DocumentPrintContext';
export { useSalesInvoicePrintActions } from './hooks/useSalesInvoicePrintActions';
export { usePurchaseInvoicePrintActions } from './hooks/usePurchaseInvoicePrintActions';
export { mapPurchaseInvoiceToPrintableDocument } from './mappers/purchaseInvoicePrintMapper';
export type { PurchaseInvoiceUiSnapshot } from './mappers/purchaseInvoicePrintMapper';
export { useSalesOrderPrintActions } from './hooks/useSalesOrderPrintActions';
export { mapSalesOrderToPrintableDocument } from './mappers/salesOrderPrintMapper';
export type { SalesOrderUiSnapshot } from './mappers/salesOrderPrintMapper';
export { useQuotationPrintActions } from './hooks/useQuotationPrintActions';
export { mapQuotationToPrintableDocument } from './mappers/quotationPrintMapper';
export type { QuotationUiSnapshot } from './mappers/quotationPrintMapper';
export { usePurchaseOrderPrintActions } from './hooks/usePurchaseOrderPrintActions';
export { mapPurchaseOrderToPrintableDocument } from './mappers/purchaseOrderPrintMapper';
export type { PurchaseOrderUiSnapshot } from './mappers/purchaseOrderPrintMapper';
export { useGrnPrintActions } from './hooks/useGrnPrintActions';
export { mapGrnToPrintableDocument } from './mappers/grnPrintMapper';
export type { GrnUiSnapshot } from './mappers/grnPrintMapper';
export { useDeliveryChallanPrintActions } from './hooks/useDeliveryChallanPrintActions';
export { mapDeliveryChallanToPrintableDocument } from './mappers/deliveryChallanPrintMapper';
export type { DeliveryChallanUiSnapshot } from './mappers/deliveryChallanPrintMapper';
export { useSalesReturnPrintActions } from './hooks/useSalesReturnPrintActions';
export { mapSalesReturnToPrintableDocument } from './mappers/salesReturnPrintMapper';
export type { SalesReturnUiSnapshot } from './mappers/salesReturnPrintMapper';
