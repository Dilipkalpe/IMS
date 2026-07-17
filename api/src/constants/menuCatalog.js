/**

 * Menu catalog mirrored from WPF NavigationCatalog / NavKeys.

 * Section rows are parents; leaf rows map to sidebar NavKey.

 */

export const MENU_SECTIONS = [

  { menuKey: 'section-dashboard', menuName: 'Overview', menuOrder: 1, icon: '\uE80F' },

  { menuKey: 'section-sales', menuName: 'Sales', menuOrder: 2, icon: '\uE8A1' },

  { menuKey: 'section-purchase', menuName: 'Procurement', menuOrder: 3, icon: '\uE719' },

  { menuKey: 'section-job-work', menuName: 'Manufacturing', menuOrder: 4, icon: '\uE912' },

  { menuKey: 'section-payroll', menuName: 'Payroll & HR', menuOrder: 5, icon: '\uE8C8' },

  { menuKey: 'section-inventory', menuName: 'Inventory', menuOrder: 6, icon: '\uE8AB' },

  { menuKey: 'section-finance', menuName: 'Finance', menuOrder: 7, icon: '\uE8C8' },

  { menuKey: 'section-mis', menuName: 'Insights', menuOrder: 8, icon: '\uE9D9' },

  { menuKey: 'section-receivables', menuName: 'AR & AP', menuOrder: 9, icon: '\uE8C8' },

  { menuKey: 'section-inv-reports', menuName: 'Inventory Insights', menuOrder: 10, icon: '\uE74C' },

  { menuKey: 'section-financial', menuName: 'Financial Reports', menuOrder: 11, icon: '\uE8F1' },

  { menuKey: 'section-registers', menuName: 'Transaction Reports', menuOrder: 12, icon: '\uE8A1' },

  { menuKey: 'section-admin', menuName: 'Master Data', menuOrder: 13, icon: '\uE77B' },

  { menuKey: 'section-security', menuName: 'User Administration', menuOrder: 14, icon: '\uE72E' },

  { menuKey: 'section-it-security', menuName: 'Platform', menuOrder: 15, icon: '\uE90E' },

  { menuKey: 'section-import', menuName: 'Bulk Import', menuOrder: 16, icon: '\uE8B5' }

];



export const MENU_ITEMS = [

  { menuKey: 'dashboard', menuName: 'Overview', parentKey: 'section-dashboard', menuUrl: 'dashboard', menuOrder: 1, icon: '\uE80F' },



  { menuKey: 'sales-orders', menuName: 'Sales Orders', parentKey: 'section-sales', menuUrl: 'sales-orders', menuOrder: 1 },

  { menuKey: 'quotation', menuName: 'Quotes', parentKey: 'section-sales', menuUrl: 'quotation', menuOrder: 2 },

  { menuKey: 'delivery-challan', menuName: 'Delivery Notes', parentKey: 'section-sales', menuUrl: 'delivery-challan', menuOrder: 3 },

  { menuKey: 'sales-invoice', menuName: 'Invoices', parentKey: 'section-sales', menuUrl: 'sales-invoice', menuOrder: 4 },

  { menuKey: 'sales-return', menuName: 'Returns', parentKey: 'section-sales', menuUrl: 'sales-return', menuOrder: 5 },



  { menuKey: 'purchase-orders', menuName: 'Purchase Orders', parentKey: 'section-purchase', menuUrl: 'purchase-orders', menuOrder: 1 },

  { menuKey: 'grn', menuName: 'Goods Receipt', parentKey: 'section-purchase', menuUrl: 'grn', menuOrder: 2 },

  { menuKey: 'purchase-invoice', menuName: 'Vendor Bills', parentKey: 'section-purchase', menuUrl: 'purchase-invoice', menuOrder: 3 },

  { menuKey: 'purchase-return', menuName: 'Vendor Returns', parentKey: 'section-purchase', menuUrl: 'purchase-return', menuOrder: 4 },



  { menuKey: 'production-orders', menuName: 'Work Orders', parentKey: 'section-job-work', menuUrl: 'production-orders', menuOrder: 1 },

  { menuKey: 'bom', menuName: 'Bill of Materials', parentKey: 'section-job-work', menuUrl: 'bom', menuOrder: 2 },



  { menuKey: 'payroll-employees', menuName: 'Employees', parentKey: 'section-payroll', menuUrl: 'payroll-employees', menuOrder: 1 },

  { menuKey: 'attendance', menuName: 'Time & Attendance', parentKey: 'section-payroll', menuUrl: 'attendance', menuOrder: 2 },

  { menuKey: 'payroll-runs', menuName: 'Payroll Runs', parentKey: 'section-payroll', menuUrl: 'payroll-runs', menuOrder: 3 },

  { menuKey: 'payroll-reports', menuName: 'Payroll Reports', parentKey: 'section-payroll', menuUrl: 'payroll-reports', menuOrder: 4 },



  { menuKey: 'stock-movements', menuName: 'Stock Activity', parentKey: 'section-inventory', menuUrl: 'stock-movements', menuOrder: 1 },

  { menuKey: 'stock-transfer', menuName: 'Transfers', parentKey: 'section-inventory', menuUrl: 'stock-transfer', menuOrder: 2 },



  { menuKey: 'payment-voucher', menuName: 'Payments', parentKey: 'section-finance', menuUrl: 'payment-voucher', menuOrder: 1 },

  { menuKey: 'receipt-voucher', menuName: 'Collections', parentKey: 'section-finance', menuUrl: 'receipt-voucher', menuOrder: 2 },

  { menuKey: 'debit-note', menuName: 'Debit Notes', parentKey: 'section-finance', menuUrl: 'debit-note', menuOrder: 3 },

  { menuKey: 'credit-note', menuName: 'Credit Notes', parentKey: 'section-finance', menuUrl: 'credit-note', menuOrder: 4 },

  { menuKey: 'bank-entry', menuName: 'Banking', parentKey: 'section-finance', menuUrl: 'bank-entry', menuOrder: 5 },

  { menuKey: 'petty-cash', menuName: 'Cash Management', parentKey: 'section-finance', menuUrl: 'petty-cash', menuOrder: 6 },



  { menuKey: 'ledger-report', menuName: 'General Ledger', parentKey: 'section-mis', menuUrl: 'ledger-report', menuOrder: 1 },

  { menuKey: 'reorder-level', menuName: 'Low Stock', parentKey: 'section-mis', menuUrl: 'reorder-level', menuOrder: 2 },

  { menuKey: 'profit-analysis', menuName: 'Profitability', parentKey: 'section-mis', menuUrl: 'profit-analysis', menuOrder: 3 },

  { menuKey: 'purchase-analysis', menuName: 'Spend Analysis', parentKey: 'section-mis', menuUrl: 'purchase-analysis', menuOrder: 4 },

  { menuKey: 'sales-analysis', menuName: 'Sales Performance', parentKey: 'section-mis', menuUrl: 'sales-analysis', menuOrder: 5 },

  { menuKey: 'production-report', menuName: 'Production Metrics', parentKey: 'section-mis', menuUrl: 'production-report', menuOrder: 6 },



  { menuKey: 'outstanding', menuName: 'Open Balances', parentKey: 'section-receivables', menuUrl: 'outstanding', menuOrder: 1 },

  { menuKey: 'due-day', menuName: 'Aging (Due Date)', parentKey: 'section-receivables', menuUrl: 'due-day', menuOrder: 2 },

  { menuKey: 'due-amount', menuName: 'Aging (By Value)', parentKey: 'section-receivables', menuUrl: 'due-amount', menuOrder: 3 },



  { menuKey: 'opening-stock', menuName: 'Opening Inventory', parentKey: 'section-inv-reports', menuUrl: 'opening-stock', menuOrder: 1 },

  { menuKey: 'closing-stock', menuName: 'Closing Inventory', parentKey: 'section-inv-reports', menuUrl: 'closing-stock', menuOrder: 2 },

  { menuKey: 'stock-summary', menuName: 'Inventory Summary', parentKey: 'section-inv-reports', menuUrl: 'stock-summary', menuOrder: 3 },



  { menuKey: 'trial-balance', menuName: 'Trial Balance', parentKey: 'section-financial', menuUrl: 'trial-balance', menuOrder: 1 },

  { menuKey: 'trading-account', menuName: 'Trading Statement', parentKey: 'section-financial', menuUrl: 'trading-account', menuOrder: 2 },

  { menuKey: 'profit-loss', menuName: 'Income Statement', parentKey: 'section-financial', menuUrl: 'profit-loss', menuOrder: 3 },

  { menuKey: 'profit-loss-trading', menuName: 'Income Statement (Full)', parentKey: 'section-financial', menuUrl: 'profit-loss-trading', menuOrder: 4 },

  { menuKey: 'balance-sheet', menuName: 'Balance Sheet', parentKey: 'section-financial', menuUrl: 'balance-sheet', menuOrder: 5 },



  { menuKey: 'sales-order-register', menuName: 'Sales Orders Report', parentKey: 'section-registers', menuUrl: 'sales-order-register', menuOrder: 1 },

  { menuKey: 'sales-dc-register', menuName: 'Delivery Notes Report', parentKey: 'section-registers', menuUrl: 'sales-dc-register', menuOrder: 2 },

  { menuKey: 'sales-invoice-register', menuName: 'Invoices Report', parentKey: 'section-registers', menuUrl: 'sales-invoice-register', menuOrder: 3 },

  { menuKey: 'sales-return-register', menuName: 'Returns Report', parentKey: 'section-registers', menuUrl: 'sales-return-register', menuOrder: 4 },

  { menuKey: 'purchase-order-register', menuName: 'Purchase Orders Report', parentKey: 'section-registers', menuUrl: 'purchase-order-register', menuOrder: 5 },

  { menuKey: 'grn-register', menuName: 'Goods Receipt Report', parentKey: 'section-registers', menuUrl: 'grn-register', menuOrder: 6 },

  { menuKey: 'purchase-invoice-register', menuName: 'Vendor Bills Report', parentKey: 'section-registers', menuUrl: 'purchase-invoice-register', menuOrder: 7 },

  { menuKey: 'purchase-return-register', menuName: 'Vendor Returns Report', parentKey: 'section-registers', menuUrl: 'purchase-return-register', menuOrder: 8 },



  { menuKey: 'products', menuName: 'Product Catalog', parentKey: 'section-admin', menuUrl: 'products', menuOrder: 1 },

  { menuKey: 'product-types', menuName: 'Categories', parentKey: 'section-admin', menuUrl: 'product-types', menuOrder: 2 },

  { menuKey: 'main-groups', menuName: 'Product Groups', parentKey: 'section-admin', menuUrl: 'main-groups', menuOrder: 3 },

  { menuKey: 'sub-groups', menuName: 'Subgroups', parentKey: 'section-admin', menuUrl: 'sub-groups', menuOrder: 4 },

  { menuKey: 'assembly-types', menuName: 'Assembly Types', parentKey: 'section-admin', menuUrl: 'assembly-types', menuOrder: 5 },

  { menuKey: 'machines', menuName: 'Equipment', parentKey: 'section-admin', menuUrl: 'machines', menuOrder: 6 },

  { menuKey: 'warehouses', menuName: 'Locations', parentKey: 'section-admin', menuUrl: 'warehouses', menuOrder: 7 },

  { menuKey: 'sale-uom', menuName: 'Sales Units', parentKey: 'section-admin', menuUrl: 'sale-uom', menuOrder: 8 },

  { menuKey: 'purchase-uom', menuName: 'Purchase Units', parentKey: 'section-admin', menuUrl: 'purchase-uom', menuOrder: 9 },

  { menuKey: 'account-ledger', menuName: 'Chart of Accounts', parentKey: 'section-admin', menuUrl: 'account-ledger', menuOrder: 10 },

  { menuKey: 'suppliers', menuName: 'Suppliers', parentKey: 'section-admin', menuUrl: 'suppliers', menuOrder: 11 },

  { menuKey: 'company-registration', menuName: 'Companies', parentKey: 'section-admin', menuUrl: 'company-registration', menuOrder: 12 },

  { menuKey: 'customer-types', menuName: 'Party Types', parentKey: 'section-admin', menuUrl: 'customer-types', menuOrder: 13 },



  { menuKey: 'user-roles', menuName: 'Users', parentKey: 'section-security', menuUrl: 'user-roles', menuOrder: 1 },

  { menuKey: 'role-master', menuName: 'Roles & Permissions', parentKey: 'section-security', menuUrl: 'role-master', menuOrder: 2 },



  { menuKey: 'financial-years', menuName: 'Fiscal Years', parentKey: 'section-it-security', menuUrl: 'financial-years', menuOrder: 1 },

  { menuKey: 'settings', menuName: 'Preferences', parentKey: 'section-it-security', menuUrl: 'settings', menuOrder: 2 },

  { menuKey: 'bill-format-designer', menuName: 'Print Templates', parentKey: 'section-it-security', menuUrl: 'bill-format-designer', menuOrder: 3 },

  { menuKey: 'report-formats-canvas', menuName: 'Report Builder', parentKey: 'section-it-security', menuUrl: 'report-formats-canvas', menuOrder: 4 },



  { menuKey: 'import-product', menuName: 'Products', parentKey: 'section-import', menuUrl: 'import-product', menuOrder: 1 },

  { menuKey: 'import-account', menuName: 'Accounts', parentKey: 'section-import', menuUrl: 'import-account', menuOrder: 2 },

  { menuKey: 'import-sales-invoice', menuName: 'Sales Invoices', parentKey: 'section-import', menuUrl: 'import-sales-invoice', menuOrder: 3 },

  { menuKey: 'import-purchase-invoice', menuName: 'Vendor Bills', parentKey: 'section-import', menuUrl: 'import-purchase-invoice', menuOrder: 4 }

];



export function allMenuDefinitions() {

  const sections = MENU_SECTIONS.map((s) => ({

    ...s,

    menuUrl: s.menuKey,

    isSection: true,

    parentKey: null

  }));

  const items = MENU_ITEMS.map((m) => ({ ...m, isSection: false }));

  return [...sections, ...items];

}

