import type { DashboardPayload } from '../api/dashboard';

const THEME = {
  primary: '#006B9E',
  success: '#0D7A55',
  warning: '#B8860B',
  purple: '#5B4B8A',
  teal: '#00857A',
};

export function buildSampleDashboard(): DashboardPayload {
  return {
    stats: [
      { label: "Today's Sales", value: '₹52,000', iconGlyph: '\uE8A1', accentColor: THEME.primary },
      { label: 'Total Sales', value: '₹1,25,000', iconGlyph: '\uE7B8', accentColor: THEME.primary },
      { label: 'Total Purchase', value: '₹78,000', iconGlyph: '\uE73E', accentColor: THEME.success },
      { label: 'Income / Expenses', value: '₹47,000', iconGlyph: '\uE719', accentColor: THEME.warning },
      { label: 'Inventory Value', value: '₹9,27,000', iconGlyph: '\uE7FC', accentColor: THEME.teal },
      { label: 'Open Sales Orders', value: '12', iconGlyph: '\uE8FD', accentColor: THEME.purple },
    ],
    rows: [
      { col1: 'Income (125)', col2: '₹ 5,20,000', col3: 'Accounting', col4: 'Live', status: 'Active' },
      { col1: 'Expenses (98)', col2: '₹ 3,10,000', col3: 'Accounting', col4: 'Live', status: 'Active' },
      { col1: 'Receivables (18)', col2: '₹ 65,000', col3: 'Finance', col4: 'Outstanding', status: 'Open' },
      { col1: 'Payables (11)', col2: '₹ 42,000', col3: 'Finance', col4: 'Outstanding', status: 'Open' },
    ],
    alerts: [
      { title: 'Orders (25)', detail: '25', severity: 'Active', iconGlyph: '\uE8A1' },
      { title: 'Progress (20)', detail: '70%', severity: 'Good', iconGlyph: '\uE895' },
      { title: 'Completed (14)', detail: '14', severity: 'Good', iconGlyph: '\uE73E' },
      { title: 'Delayed (3)', detail: '3', severity: 'Warning', iconGlyph: '\uE7BA' },
    ],
    summaryLines: [
      { label: 'Raw (64)', value: '3,200', iconGlyph: '\uE7FC' },
      { label: 'WIP (22)', value: '1,450', iconGlyph: '\uE9CE' },
      { label: 'Finished (48)', value: '5,100', iconGlyph: '\uE8A5' },
      { label: 'Low Stock (6)', value: '6', iconGlyph: '\uE7BA' },
    ],
    charts: {
      salesVsPurchase: {
        title: 'Accounting Overview',
        series1Name: 'Sales',
        series2Name: 'Purchase',
        series1Color: THEME.primary,
        series2Color: THEME.warning,
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        series1: [120000, 98000, 145000, 132000, 156000, 168000],
        series2: [95000, 110000, 88000, 124000, 101000, 115000],
      },
      stockByType: {
        title: 'Inventory trend by type',
        series1Name: 'Qty on hand',
        series2Name: 'Products',
        series1Color: THEME.primary,
        series2Color: THEME.teal,
        labels: ['Raw', 'WIP', 'Finished', 'Low stock'],
        series1: [3200, 1450, 5100, 6],
        series2: [64, 22, 48, 0],
      },
      stockByCategory: {
        title: 'Stock value by category',
        slices: [
          { label: 'Finished Good', value: 420000, color: THEME.primary },
          { label: 'Raw Material', value: 280000, color: THEME.success },
          { label: 'Component', value: 142000, color: THEME.warning },
          { label: 'General', value: 85000, color: THEME.purple },
        ],
        labels: [],
      },
    },
  };
}
