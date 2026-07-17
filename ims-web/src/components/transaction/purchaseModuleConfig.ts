import { NavKeys } from '../../navigation/navKeys';

export const PURCHASE_MODULE_CONFIG = {
  purchaseOrder: { menuKey: NavKeys.PurchaseOrders, moduleTitle: 'Purchase Orders' },
  grn: { menuKey: NavKeys.Grn, moduleTitle: 'Goods Receipt' },
  purchaseInvoice: { menuKey: NavKeys.PurchaseInvoice, moduleTitle: 'Vendor Bills' },
  purchaseReturn: { menuKey: NavKeys.PurchaseReturn, moduleTitle: 'Vendor Returns' },
} as const;
