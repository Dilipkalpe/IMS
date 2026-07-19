import { NavKeys } from '../navigation/navKeys';

export interface SalesHubTab {
  key: string;
  title: string;
  iconGlyph: string;
  description: string;
}

/** Sales modules shown as horizontal tabs inside the Sales hub page. */
export const SALES_HUB_TABS: SalesHubTab[] = [
  {
    key: NavKeys.SalesOrders,
    title: 'Sales Orders',
    iconGlyph: '\uE8A1',
    description: 'Customer orders and fulfillment pipeline.',
  },
  {
    key: NavKeys.Quotation,
    title: 'Quotes',
    iconGlyph: '\uE8E5',
    description: 'Customer quotations and price proposals.',
  },
  {
    key: NavKeys.DeliveryChallan,
    title: 'Delivery Notes',
    iconGlyph: '\uE7BF',
    description: 'Outbound delivery documentation against sales orders.',
  },
  {
    key: NavKeys.SalesInvoice,
    title: 'Invoices',
    iconGlyph: '\uE8A5',
    description: 'Tax invoices and customer billing.',
  },
  {
    key: NavKeys.SalesReturn,
    title: 'Returns',
    iconGlyph: '\uE10F',
    description: 'Sales returns and credit adjustments.',
  },
];

export const SALES_MODULE_NAV_KEYS = SALES_HUB_TABS.map((t) => t.key);

export const DEFAULT_SALES_HUB_TAB = NavKeys.SalesOrders;

export function isSalesModuleNavKey(key: string): boolean {
  return SALES_MODULE_NAV_KEYS.includes(key);
}

export function resolveSalesHubTab(key: string): string {
  return isSalesModuleNavKey(key) ? key : DEFAULT_SALES_HUB_TAB;
}

export function getSalesHubTabTitle(key: string): string | undefined {
  return SALES_HUB_TABS.find((t) => t.key === key)?.title;
}
