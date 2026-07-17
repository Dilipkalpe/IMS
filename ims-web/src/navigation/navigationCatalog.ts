import type { NavigationCatalogItem } from './navigationRouteMap';
import { NavKeys } from './navKeys';

/** Mirrors IMS/Services/NavigationCatalog.cs — section names, order, and menu keys. */
export const navigationCatalog: NavigationCatalogItem[] = [
  { key: NavKeys.Dashboard, title: 'Overview', section: 'Overview', iconGlyph: '\uE80F', description: 'KPIs, charts, and operational snapshot across your organization.' },

  { key: NavKeys.SalesOrders, title: 'Sales Orders', section: 'Sales', iconGlyph: '\uE8A1', description: 'Customer orders and fulfillment pipeline.' },
  { key: NavKeys.Quotation, title: 'Quotes', section: 'Sales', iconGlyph: '\uE8E5', description: 'Customer quotations and price proposals.' },
  { key: NavKeys.DeliveryChallan, title: 'Delivery Notes', section: 'Sales', iconGlyph: '\uE7BF', description: 'Outbound delivery documentation against sales orders.' },
  { key: NavKeys.SalesInvoice, title: 'Invoices', section: 'Sales', iconGlyph: '\uE8A5', description: 'Tax invoices and customer billing.' },
  { key: NavKeys.SalesReturn, title: 'Returns', section: 'Sales', iconGlyph: '\uE10F', description: 'Sales returns and credit adjustments.' },

  { key: NavKeys.PurchaseOrders, title: 'Purchase Orders', section: 'Procurement', iconGlyph: '\uE719', description: 'Procurement orders for materials and services.' },
  { key: NavKeys.Grn, title: 'Goods Receipt', section: 'Procurement', iconGlyph: '\uE8FB', description: 'Inbound goods receipt and vendor deliveries.' },
  { key: NavKeys.PurchaseInvoice, title: 'Vendor Bills', section: 'Procurement', iconGlyph: '\uE8A5', description: 'Supplier invoices and accounts payable.' },
  { key: NavKeys.PurchaseReturn, title: 'Vendor Returns', section: 'Procurement', iconGlyph: '\uE10F', description: 'Returns to suppliers and debit adjustments.' },

  { key: NavKeys.ProductionOrders, title: 'Work Orders', section: 'Manufacturing', iconGlyph: '\uE912', description: 'Production jobs — BOM, routing, and stock movements.' },
  { key: NavKeys.Bom, title: 'Bill of Materials', section: 'Manufacturing', iconGlyph: '\uE8F1', description: 'Product BOM — raw materials, consumables, and revisions.' },

  { key: NavKeys.PayrollEmployees, title: 'Employees', section: 'Payroll & HR', iconGlyph: '\uE716', description: 'Employee records, compensation, and statutory details.' },
  { key: NavKeys.Attendance, title: 'Time & Attendance', section: 'Payroll & HR', iconGlyph: '\uE787', description: 'Daily attendance, leave, and overtime.' },
  { key: NavKeys.PayrollRuns, title: 'Payroll Runs', section: 'Payroll & HR', iconGlyph: '\uE8C8', description: 'Process monthly payroll — earnings, deductions, and net pay.' },
  { key: NavKeys.PayrollReports, title: 'Payroll Reports', section: 'Payroll & HR', iconGlyph: '\uE9D9', description: 'Payslips, tax summaries, and workforce analytics.' },

  { key: NavKeys.StockMovements, title: 'Stock Activity', section: 'Inventory', iconGlyph: '\uE8AB', description: 'Inventory receipts, issues, and adjustments.' },
  { key: NavKeys.StockTransfer, title: 'Transfers', section: 'Inventory', iconGlyph: '\uE8AB', description: 'Inter-location and warehouse stock transfers.' },

  { key: NavKeys.PaymentVoucher, title: 'Payments', section: 'Finance', iconGlyph: '\uE8C8', description: 'Outgoing vendor and expense payments.' },
  { key: NavKeys.ReceiptVoucher, title: 'Collections', section: 'Finance', iconGlyph: '\uE8C7', description: 'Incoming customer receipts and collections.' },
  { key: NavKeys.DebitNote, title: 'Debit Notes', section: 'Finance', iconGlyph: '\uE8C0', description: 'Debit notes issued to parties.' },
  { key: NavKeys.CreditNote, title: 'Credit Notes', section: 'Finance', iconGlyph: '\uE8C1', description: 'Credit notes issued to parties.' },
  { key: NavKeys.BankEntry, title: 'Banking', section: 'Finance', iconGlyph: '\uE825', description: 'Bank deposits, withdrawals, and transfers.' },
  { key: NavKeys.PettyCash, title: 'Cash Management', section: 'Finance', iconGlyph: '\uE8C4', description: 'Petty cash and imprest expenses.' },

  { key: NavKeys.LedgerReport, title: 'General Ledger', section: 'Insights', iconGlyph: '\uE9D9', description: 'Account-wise ledger transactions and balances.' },
  { key: NavKeys.ReorderLevel, title: 'Low Stock', section: 'Insights', iconGlyph: '\uE7BA', description: 'Items at or below reorder thresholds.' },
  { key: NavKeys.ProfitAnalysis, title: 'Profitability', section: 'Insights', iconGlyph: '\uE9D2', description: 'Margin and profit analysis by product and period.' },
  { key: NavKeys.PurchaseAnalysis, title: 'Spend Analysis', section: 'Insights', iconGlyph: '\uE719', description: 'Procurement spend and vendor analysis.' },
  { key: NavKeys.SalesAnalysis, title: 'Sales Performance', section: 'Insights', iconGlyph: '\uE8A1', description: 'Revenue and sales trend analysis.' },
  { key: NavKeys.ProductionReport, title: 'Production Metrics', section: 'Insights', iconGlyph: '\uE912', description: 'Manufacturing output and efficiency metrics.' },

  { key: NavKeys.OutstandingReport, title: 'Open Balances', section: 'AR & AP', iconGlyph: '\uE8C8', description: 'Outstanding receivables and payables.' },
  { key: NavKeys.DueDayReport, title: 'Aging (Due Date)', section: 'AR & AP', iconGlyph: '\uE787', description: 'Aging analysis grouped by due date.' },
  { key: NavKeys.DueAmountReport, title: 'Aging (By Value)', section: 'AR & AP', iconGlyph: '\uE8C7', description: 'Aging analysis grouped by amount slabs.' },

  { key: NavKeys.OpeningStock, title: 'Opening Inventory', section: 'Inventory Insights', iconGlyph: '\uE74C', description: 'Opening stock by item and location.' },
  { key: NavKeys.ClosingStock, title: 'Closing Inventory', section: 'Inventory Insights', iconGlyph: '\uE74C', description: 'Closing stock by item and location.' },
  { key: NavKeys.StockSummary, title: 'Inventory Summary', section: 'Inventory Insights', iconGlyph: '\uE9D9', description: 'Detailed inventory movement and valuation summary.' },

  { key: NavKeys.TrialBalance, title: 'Trial Balance', section: 'Financial Reports', iconGlyph: '\uE8C8', description: 'Trial balance for the selected period.' },
  { key: NavKeys.TradingAccount, title: 'Trading Statement', section: 'Financial Reports', iconGlyph: '\uE9D2', description: 'Trading account for the period.' },
  { key: NavKeys.ProfitLoss, title: 'Income Statement', section: 'Financial Reports', iconGlyph: '\uE9D2', description: 'Profit and loss for the period.' },
  { key: NavKeys.ProfitLossWithTrading, title: 'Income Statement (Full)', section: 'Financial Reports', iconGlyph: '\uE9D2', description: 'Combined trading and profit & loss statement.' },
  { key: NavKeys.BalanceSheet, title: 'Balance Sheet', section: 'Financial Reports', iconGlyph: '\uE8F1', description: 'Statement of financial position as at date.' },

  { key: NavKeys.SalesOrderRegister, title: 'Sales Orders Report', section: 'Transaction Reports', iconGlyph: '\uE8A1', description: 'Sales order listing with date and document filters.' },
  { key: NavKeys.SalesDcRegister, title: 'Delivery Notes Report', section: 'Transaction Reports', iconGlyph: '\uE7BF', description: 'Delivery note listing with date and document filters.' },
  { key: NavKeys.SalesInvoiceRegister, title: 'Invoices Report', section: 'Transaction Reports', iconGlyph: '\uE8A5', description: 'Sales invoice listing with date and document filters.' },
  { key: NavKeys.SalesReturnRegister, title: 'Returns Report', section: 'Transaction Reports', iconGlyph: '\uE10F', description: 'Sales return listing with date and document filters.' },
  { key: NavKeys.PurchaseOrderRegister, title: 'Purchase Orders Report', section: 'Transaction Reports', iconGlyph: '\uE719', description: 'Purchase order listing with date and document filters.' },
  { key: NavKeys.GrnRegister, title: 'Goods Receipt Report', section: 'Transaction Reports', iconGlyph: '\uE8FB', description: 'Goods receipt listing with date and document filters.' },
  { key: NavKeys.PurchaseInvoiceRegister, title: 'Vendor Bills Report', section: 'Transaction Reports', iconGlyph: '\uE8A5', description: 'Vendor bill listing with date and document filters.' },
  { key: NavKeys.PurchaseReturnRegister, title: 'Vendor Returns Report', section: 'Transaction Reports', iconGlyph: '\uE10F', description: 'Vendor return listing with date and document filters.' },

  { key: NavKeys.Products, title: 'Product Catalog', section: 'Master Data', iconGlyph: '\uE7B8', description: 'Products — raw materials, components, and finished goods.' },
  { key: NavKeys.ProductTypes, title: 'Categories', section: 'Master Data', iconGlyph: '\uE8FD', description: 'Product category classification.' },
  { key: NavKeys.MainGroups, title: 'Product Groups', section: 'Master Data', iconGlyph: '\uE8B7', description: 'Top-level product grouping.' },
  { key: NavKeys.SubGroups, title: 'Subgroups', section: 'Master Data', iconGlyph: '\uE8B7', description: 'Secondary product grouping.' },
  { key: NavKeys.AssemblyTypes, title: 'Assembly Types', section: 'Master Data', iconGlyph: '\uE8F1', description: 'Assembly and BOM type definitions.' },
  { key: NavKeys.Machines, title: 'Equipment', section: 'Master Data', iconGlyph: '\uE912', description: 'Production equipment and work centers.' },
  { key: NavKeys.Warehouses, title: 'Locations', section: 'Master Data', iconGlyph: '\uE7F4', description: 'Warehouses and storage locations.' },
  { key: NavKeys.SaleUom, title: 'Sales Units', section: 'Master Data', iconGlyph: '\uE7C5', description: 'Units of measure for sales transactions.' },
  { key: NavKeys.PurchaseUom, title: 'Purchase Units', section: 'Master Data', iconGlyph: '\uE7C5', description: 'Units of measure for procurement.' },
  { key: NavKeys.AccountLedger, title: 'Chart of Accounts', section: 'Master Data', iconGlyph: '\uE8C8', description: 'Ledger accounts, customers, and suppliers.' },
  { key: NavKeys.Suppliers, title: 'Suppliers', section: 'Master Data', iconGlyph: '\uE716', description: 'Supplier and vendor master records.' },
  { key: NavKeys.CompanyRegistration, title: 'Companies', section: 'Master Data', iconGlyph: '\uE731', description: 'Legal entities, GST, and banking profiles for multi-company operations.' },
  { key: NavKeys.CustomerTypes, title: 'Party Types', section: 'Master Data', iconGlyph: '\uE77B', description: 'Customer and vendor classification.' },

  { key: NavKeys.UserRoles, title: 'Users', section: 'User Administration', iconGlyph: '\uE77B', description: 'User accounts and tenant access.' },
  { key: NavKeys.RoleMaster, title: 'Roles & Permissions', section: 'User Administration', iconGlyph: '\uE72E', description: 'Roles and menu-level permissions (Administrator role).' },

  { key: NavKeys.FinancialYears, title: 'Fiscal Years', section: 'Platform', iconGlyph: '\uE787', description: 'Fiscal periods, year-end close, and period switching.' },
  { key: NavKeys.Settings, title: 'Preferences', section: 'Platform', iconGlyph: '\uE713', description: 'Application settings, themes, and defaults.' },
  { key: NavKeys.BillFormatDesigner, title: 'Print Templates', section: 'Platform', iconGlyph: '\uE8A5', description: 'Document print layouts for sales, purchase, and inventory.' },
  { key: NavKeys.ReportFormatsCanvas, title: 'Report Builder', section: 'Platform', iconGlyph: '\uE8B5', description: 'Custom report layouts and canvas designer.' },

  { key: NavKeys.ImportProduct, title: 'Products', section: 'Bulk Import', iconGlyph: '\uE8B5', description: 'Bulk import product master data from Excel.' },
  { key: NavKeys.ImportAccount, title: 'Accounts', section: 'Bulk Import', iconGlyph: '\uE8C8', description: 'Bulk import customers and suppliers from Excel.' },
  { key: NavKeys.ImportSalesInvoice, title: 'Sales Invoices', section: 'Bulk Import', iconGlyph: '\uE8A5', description: 'Bulk import sales invoices with line items.' },
  { key: NavKeys.ImportPurchaseInvoice, title: 'Vendor Bills', section: 'Bulk Import', iconGlyph: '\uE719', description: 'Bulk import purchase invoices with line items.' },
];

/** WPF NavigationCatalog section order */
const SECTION_ORDER = [
  'Overview',
  'Sales',
  'Procurement',
  'Manufacturing',
  'Payroll & HR',
  'Inventory',
  'Finance',
  'Insights',
  'AR & AP',
  'Inventory Insights',
  'Financial Reports',
  'Transaction Reports',
  'Master Data',
  'User Administration',
  'Platform',
  'Bulk Import',
] as const;

export function buildNavigationSections(): Array<{
  name: string;
  isExpanded: boolean;
  items: NavigationCatalogItem[];
}> {
  const bySection = new Map<string, NavigationCatalogItem[]>();
  for (const item of navigationCatalog) {
    if (!bySection.has(item.section)) bySection.set(item.section, []);
    bySection.get(item.section)!.push(item);
  }
  return SECTION_ORDER.filter((name) => bySection.has(name)).map((name) => ({
    name,
    isExpanded: true,
    items: bySection.get(name)!,
  }));
}
