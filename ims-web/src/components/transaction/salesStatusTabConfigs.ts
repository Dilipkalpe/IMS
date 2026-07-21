import type { StatusTabItem } from './StatusTabBar';
import type { SalesInvoiceListStats } from '../../sales-invoice/repository/types';
import type { SalesOrderListStats } from '../../sales-order/repository/types';

const GLYPHS = {
  all: '\uE8A5',
  open: '\uE8E5',
  confirmed: '\uE7C8',
  picking: '\uE7BF',
  shipped: '\uE7EB',
  cancelled: '\uE711',
  draft: '\uE70F',
  posted: '\uE73E',
} as const;

const COLORS = {
  teal: '#14b8a6',
  green: '#16a34a',
  blue: '#2563eb',
  amber: '#d97706',
  navy: '#1e3a5f',
  red: '#dc2626',
  slate: '#64748b',
} as const;

export function buildSalesOrderStatusTabs(stats: SalesOrderListStats): StatusTabItem[] {
  const picking = stats.picking ?? 0;
  return [
    {
      id: 'all',
      label: 'Sales Orders',
      count: stats.total,
      filterValue: 'All',
      color: COLORS.teal,
      iconGlyph: GLYPHS.all,
    },
    {
      id: 'open',
      label: 'Open',
      count: stats.open + stats.draft,
      filterValue: 'Open',
      color: COLORS.green,
      iconGlyph: GLYPHS.open,
    },
    {
      id: 'confirmed',
      label: 'Confirmed',
      count: stats.confirmed,
      filterValue: 'Confirmed',
      color: COLORS.blue,
      iconGlyph: GLYPHS.confirmed,
    },
    {
      id: 'picking',
      label: 'Picking',
      count: picking,
      filterValue: 'Picking',
      color: COLORS.amber,
      iconGlyph: GLYPHS.picking,
    },
    {
      id: 'shipped',
      label: 'Shipped',
      count: stats.shipped ?? 0,
      filterValue: 'Shipped',
      color: COLORS.navy,
      iconGlyph: GLYPHS.shipped,
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      count: stats.cancelled ?? 0,
      filterValue: 'Cancelled',
      color: COLORS.red,
      iconGlyph: GLYPHS.cancelled,
    },
  ];
}

/** Secondary status values not shown as primary tabs. */
export const SALES_ORDER_EXTRA_STATUS_FILTERS = [
  'Partially Delivered',
  'Fully Delivered',
  'Closed',
  'Draft',
] as const;

export function buildSalesInvoiceStatusTabs(stats: SalesInvoiceListStats): StatusTabItem[] {
  return [
    {
      id: 'all',
      label: 'All Invoices',
      count: stats.total,
      filterValue: 'All',
      color: COLORS.teal,
      iconGlyph: GLYPHS.all,
    },
    {
      id: 'posted',
      label: 'Posted',
      count: stats.posted,
      filterValue: 'Posted',
      color: COLORS.green,
      iconGlyph: GLYPHS.posted,
    },
    {
      id: 'draft',
      label: 'Draft',
      count: stats.draft,
      filterValue: 'Draft',
      color: COLORS.amber,
      iconGlyph: GLYPHS.draft,
    },
  ];
}
