import { DOCUMENT_TYPE_LABELS, type DocumentTypeKey } from '../document/contracts/documentTypes';
import { NavKeys } from './navKeys';
import { workspaceRouteMap } from './navigationRouteMap';

export interface WorkspaceEntryHeaderConfig {
  moduleSingular: string;
  listNavKey: string;
}

/** Document workspace entry screens (list → New / Edit). */
export const WORKSPACE_ENTRY_HEADERS: Record<string, WorkspaceEntryHeaderConfig> = {
  'sales-order-entry': {
    moduleSingular: DOCUMENT_TYPE_LABELS.sales_order,
    listNavKey: NavKeys.SalesOrders,
  },
  'quotation-entry': {
    moduleSingular: DOCUMENT_TYPE_LABELS.quotation,
    listNavKey: NavKeys.Quotation,
  },
  'delivery-challan-entry': {
    moduleSingular: DOCUMENT_TYPE_LABELS.delivery_challan,
    listNavKey: NavKeys.DeliveryChallan,
  },
  'sales-invoice-entry': {
    moduleSingular: DOCUMENT_TYPE_LABELS.sales_invoice,
    listNavKey: NavKeys.SalesInvoice,
  },
  'sales-return-entry': {
    moduleSingular: DOCUMENT_TYPE_LABELS.sales_return,
    listNavKey: NavKeys.SalesReturn,
  },
  'purchase-order-entry': {
    moduleSingular: DOCUMENT_TYPE_LABELS.purchase_order,
    listNavKey: NavKeys.PurchaseOrders,
  },
  'grn-entry': {
    moduleSingular: DOCUMENT_TYPE_LABELS.grn,
    listNavKey: NavKeys.Grn,
  },
  'purchase-invoice-entry': {
    moduleSingular: DOCUMENT_TYPE_LABELS.purchase_invoice,
    listNavKey: NavKeys.PurchaseInvoice,
  },
  'purchase-return-entry': {
    moduleSingular: DOCUMENT_TYPE_LABELS.purchase_return,
    listNavKey: NavKeys.PurchaseReturn,
  },
};

export function isWorkspaceEntryNavKey(navKey: string): boolean {
  return navKey in workspaceRouteMap;
}

export function getWorkspaceEntryHeader(navKey: string): WorkspaceEntryHeaderConfig | undefined {
  return WORKSPACE_ENTRY_HEADERS[navKey];
}

export function formatWorkspaceEntryHeaderTitle(
  navKey: string,
  documentLabel = 'New',
): string | undefined {
  const config = getWorkspaceEntryHeader(navKey);
  if (!config) return undefined;
  return `${config.moduleSingular} >> ${documentLabel}`;
}
