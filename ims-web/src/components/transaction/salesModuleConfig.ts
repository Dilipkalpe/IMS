import { NavKeys } from '../../navigation/navKeys';

export interface SalesModuleConfig {
  menuKey: string;
  moduleTitle: string;
}

export const SALES_MODULE_CONFIG = {
  salesOrder: { menuKey: NavKeys.SalesOrders, moduleTitle: 'Sales Orders' },
  deliveryChallan: { menuKey: NavKeys.DeliveryChallan, moduleTitle: 'Delivery Notes' },
  salesInvoice: { menuKey: NavKeys.SalesInvoice, moduleTitle: 'Invoices' },
  salesReturn: { menuKey: NavKeys.SalesReturn, moduleTitle: 'Returns' },
  quotation: { menuKey: NavKeys.Quotation, moduleTitle: 'Quotes' },
} as const satisfies Record<string, SalesModuleConfig>;
