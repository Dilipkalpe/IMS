import { NavKeys } from '../navigation/navKeys';



export interface ProcurementHubTab {

  key: string;

  title: string;

  iconGlyph: string;

  description: string;

}



/** Procurement modules shown as horizontal tabs inside the Procurement hub page. */

export const PROCUREMENT_HUB_TABS: ProcurementHubTab[] = [

  {

    key: NavKeys.PurchaseOrders,

    title: 'Purchase Orders',

    iconGlyph: '\uE719',

    description: 'Procurement orders for materials and services.',

  },

  {

    key: NavKeys.Grn,

    title: 'Goods Receipt',

    iconGlyph: '\uE8FB',

    description: 'Inbound goods receipt and vendor deliveries.',

  },

  {

    key: NavKeys.PurchaseInvoice,

    title: 'Vendor Bills',

    iconGlyph: '\uE8A5',

    description: 'Supplier invoices and accounts payable.',

  },

  {

    key: NavKeys.PurchaseReturn,

    title: 'Vendor Returns',

    iconGlyph: '\uE10F',

    description: 'Returns to suppliers and debit adjustments.',

  },

];



export const PROCUREMENT_MODULE_NAV_KEYS = PROCUREMENT_HUB_TABS.map((t) => t.key);



export const DEFAULT_PROCUREMENT_HUB_TAB = NavKeys.PurchaseOrders;



export function isProcurementModuleNavKey(key: string): boolean {

  return PROCUREMENT_MODULE_NAV_KEYS.includes(key);

}



export function resolveProcurementHubTab(key: string): string {

  return isProcurementModuleNavKey(key) ? key : DEFAULT_PROCUREMENT_HUB_TAB;

}



export function getProcurementHubTabTitle(key: string): string | undefined {

  return PROCUREMENT_HUB_TABS.find((t) => t.key === key)?.title;

}


