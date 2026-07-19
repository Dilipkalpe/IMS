import { NavKeys } from '../navigation/navKeys';
import { PROCUREMENT_HUB_TABS } from '../procurement/procurementHubTabs';
import { SALES_HUB_TABS } from '../sales/salesHubTabs';
import type { HubDefinition, HubTab } from './hubTypes';

function tab(
  key: string,
  title: string,
  iconGlyph: string,
  description: string,
): HubTab {
  return { key, title, iconGlyph, description };
}

/** Hub sections — single sidebar item with horizontal tabs for former submenu items. */
export const HUB_DEFINITIONS: HubDefinition[] = [
  {
    hubNavKey: NavKeys.Sales,
    sectionName: 'Sales',
    sidebarTitle: 'Sales',
    sidebarIconGlyph: '\uE8A1',
    sidebarDescription: 'Sales orders, quotes, delivery notes, invoices, and returns.',
    defaultTabKey: NavKeys.SalesOrders,
    tabs: SALES_HUB_TABS,
    wpfSource: 'Views/SalesHubView.xaml',
  },
  {
    hubNavKey: NavKeys.Procurement,
    sectionName: 'Procurement',
    sidebarTitle: 'Procurement',
    sidebarIconGlyph: '\uE719',
    sidebarDescription: 'Purchase orders, goods receipt, vendor bills, and returns.',
    defaultTabKey: NavKeys.PurchaseOrders,
    tabs: PROCUREMENT_HUB_TABS,
    wpfSource: 'Views/ProcurementHubView.xaml',
  },
  {
    hubNavKey: NavKeys.Manufacturing,
    sectionName: 'Manufacturing',
    sidebarTitle: 'Manufacturing',
    sidebarIconGlyph: '\uE912',
    sidebarDescription: 'Work orders, bill of materials, and production jobs.',
    defaultTabKey: NavKeys.ProductionOrders,
    tabs: [
      tab(NavKeys.ProductionOrders, 'Work Orders', '\uE912', 'Production jobs — BOM, routing, and stock movements.'),
      tab(NavKeys.Bom, 'Bill of Materials', '\uE8F1', 'Product BOM — raw materials, consumables, and revisions.'),
    ],
    wpfSource: 'Views/ManufacturingHubView.xaml',
  },
  {
    hubNavKey: NavKeys.PayrollHr,
    sectionName: 'Payroll & HR',
    sidebarTitle: 'Payroll & HR',
    sidebarIconGlyph: '\uE716',
    sidebarDescription: 'Employees, attendance, payroll runs, and HR reports.',
    defaultTabKey: NavKeys.PayrollEmployees,
    tabs: [
      tab(NavKeys.PayrollEmployees, 'Employees', '\uE716', 'Employee records, compensation, and statutory details.'),
      tab(NavKeys.Attendance, 'Time & Attendance', '\uE787', 'Daily attendance, leave, and overtime.'),
      tab(NavKeys.PayrollRuns, 'Payroll Runs', '\uE8C8', 'Process monthly payroll — earnings, deductions, and net pay.'),
      tab(NavKeys.PayrollReports, 'Payroll Reports', '\uE9D9', 'Payslips, tax summaries, and workforce analytics.'),
    ],
    wpfSource: 'Views/PayrollHubView.xaml',
  },
  {
    hubNavKey: NavKeys.Inventory,
    sectionName: 'Inventory',
    sidebarTitle: 'Inventory',
    sidebarIconGlyph: '\uE8AB',
    sidebarDescription: 'Stock activity, transfers, and warehouse movements.',
    defaultTabKey: NavKeys.StockMovements,
    tabs: [
      tab(NavKeys.StockMovements, 'Stock Activity', '\uE8AB', 'Inventory receipts, issues, and adjustments.'),
      tab(NavKeys.StockTransfer, 'Transfers', '\uE8AB', 'Inter-location and warehouse stock transfers.'),
    ],
    wpfSource: 'Views/InventoryHubView.xaml',
  },
  {
    hubNavKey: NavKeys.Finance,
    sectionName: 'Finance',
    sidebarTitle: 'Finance',
    sidebarIconGlyph: '\uE8C8',
    sidebarDescription: 'Payments, collections, banking, and cash management.',
    defaultTabKey: NavKeys.PaymentVoucher,
    tabs: [
      tab(NavKeys.PaymentVoucher, 'Payments', '\uE8C8', 'Outgoing vendor and expense payments.'),
      tab(NavKeys.ReceiptVoucher, 'Collections', '\uE8C7', 'Incoming customer receipts and collections.'),
      tab(NavKeys.DebitNote, 'Debit Notes', '\uE8C0', 'Debit notes issued to parties.'),
      tab(NavKeys.CreditNote, 'Credit Notes', '\uE8C1', 'Credit notes issued to parties.'),
      tab(NavKeys.BankEntry, 'Banking', '\uE825', 'Bank deposits, withdrawals, and transfers.'),
      tab(NavKeys.PettyCash, 'Cash Management', '\uE8C4', 'Petty cash and imprest expenses.'),
    ],
    wpfSource: 'Views/FinanceHubView.xaml',
  },
  {
    hubNavKey: NavKeys.Insights,
    sectionName: 'Insights',
    sidebarTitle: 'Insights',
    sidebarIconGlyph: '\uE9D9',
    sidebarDescription: 'Operational analytics — ledger, stock, profitability, and performance.',
    defaultTabKey: NavKeys.LedgerReport,
    tabs: [
      tab(NavKeys.LedgerReport, 'General Ledger', '\uE9D9', 'Account-wise ledger transactions and balances.'),
      tab(NavKeys.ReorderLevel, 'Low Stock', '\uE7BA', 'Items at or below reorder thresholds.'),
      tab(NavKeys.ProfitAnalysis, 'Profitability', '\uE9D2', 'Margin and profit analysis by product and period.'),
      tab(NavKeys.PurchaseAnalysis, 'Spend Analysis', '\uE719', 'Procurement spend and vendor analysis.'),
      tab(NavKeys.SalesAnalysis, 'Sales Performance', '\uE8A1', 'Revenue and sales trend analysis.'),
      tab(NavKeys.ProductionReport, 'Production Metrics', '\uE912', 'Manufacturing output and efficiency metrics.'),
    ],
    wpfSource: 'Views/InsightsHubView.xaml',
  },
  {
    hubNavKey: NavKeys.ArAp,
    sectionName: 'AR & AP',
    sidebarTitle: 'AR & AP',
    sidebarIconGlyph: '\uE8C8',
    sidebarDescription: 'Receivables, payables, and aging analysis.',
    defaultTabKey: NavKeys.OutstandingReport,
    tabs: [
      tab(NavKeys.OutstandingReport, 'Open Balances', '\uE8C8', 'Outstanding receivables and payables.'),
      tab(NavKeys.DueDayReport, 'Aging (Due Date)', '\uE787', 'Aging analysis grouped by due date.'),
      tab(NavKeys.DueAmountReport, 'Aging (By Value)', '\uE8C7', 'Aging analysis grouped by amount slabs.'),
    ],
    wpfSource: 'Views/ArApHubView.xaml',
  },
  {
    hubNavKey: NavKeys.InventoryInsights,
    sectionName: 'Inventory Insights',
    sidebarTitle: 'Inventory Insights',
    sidebarIconGlyph: '\uE74C',
    sidebarDescription: 'Opening, closing, and summary inventory reports.',
    defaultTabKey: NavKeys.OpeningStock,
    tabs: [
      tab(NavKeys.OpeningStock, 'Opening Inventory', '\uE74C', 'Opening stock by item and location.'),
      tab(NavKeys.ClosingStock, 'Closing Inventory', '\uE74C', 'Closing stock by item and location.'),
      tab(NavKeys.StockSummary, 'Inventory Summary', '\uE9D9', 'Detailed inventory movement and valuation summary.'),
    ],
    wpfSource: 'Views/InventoryInsightsHubView.xaml',
  },
  {
    hubNavKey: NavKeys.FinancialReports,
    sectionName: 'Financial Reports',
    sidebarTitle: 'Financial Reports',
    sidebarIconGlyph: '\uE8C8',
    sidebarDescription: 'Trial balance, trading account, income statement, and balance sheet.',
    defaultTabKey: NavKeys.TrialBalance,
    tabs: [
      tab(NavKeys.TrialBalance, 'Trial Balance', '\uE8C8', 'Trial balance for the selected period.'),
      tab(NavKeys.TradingAccount, 'Trading Statement', '\uE9D2', 'Trading account for the period.'),
      tab(NavKeys.ProfitLoss, 'Income Statement', '\uE9D2', 'Profit and loss for the period.'),
      tab(NavKeys.ProfitLossWithTrading, 'Income Statement (Full)', '\uE9D2', 'Combined trading and profit & loss statement.'),
      tab(NavKeys.BalanceSheet, 'Balance Sheet', '\uE8F1', 'Statement of financial position as at date.'),
    ],
    wpfSource: 'Views/FinancialReportsHubView.xaml',
  },
  {
    hubNavKey: NavKeys.TransactionReports,
    sectionName: 'Transaction Reports',
    sidebarTitle: 'Transaction Reports',
    sidebarIconGlyph: '\uE8A1',
    sidebarDescription: 'Document registers for sales and purchase transactions.',
    defaultTabKey: NavKeys.SalesOrderRegister,
    tabs: [
      tab(NavKeys.SalesOrderRegister, 'Sales Orders Report', '\uE8A1', 'Sales order listing with date and document filters.'),
      tab(NavKeys.SalesDcRegister, 'Delivery Notes Report', '\uE7BF', 'Delivery note listing with date and document filters.'),
      tab(NavKeys.SalesInvoiceRegister, 'Invoices Report', '\uE8A5', 'Sales invoice listing with date and document filters.'),
      tab(NavKeys.SalesReturnRegister, 'Returns Report', '\uE10F', 'Sales return listing with date and document filters.'),
      tab(NavKeys.PurchaseOrderRegister, 'Purchase Orders Report', '\uE719', 'Purchase order listing with date and document filters.'),
      tab(NavKeys.GrnRegister, 'Goods Receipt Report', '\uE8FB', 'Goods receipt listing with date and document filters.'),
      tab(NavKeys.PurchaseInvoiceRegister, 'Vendor Bills Report', '\uE8A5', 'Vendor bill listing with date and document filters.'),
      tab(NavKeys.PurchaseReturnRegister, 'Vendor Returns Report', '\uE10F', 'Vendor return listing with date and document filters.'),
    ],
    wpfSource: 'Views/TransactionReportsHubView.xaml',
  },
  {
    hubNavKey: NavKeys.MasterData,
    sectionName: 'Master Data',
    sidebarTitle: 'Master Data',
    sidebarIconGlyph: '\uE7B8',
    sidebarDescription: 'Products, accounts, locations, and reference master data.',
    defaultTabKey: NavKeys.Products,
    tabs: [
      tab(NavKeys.Products, 'Product Catalog', '\uE7B8', 'Products — raw materials, components, and finished goods.'),
      tab(NavKeys.ProductTypes, 'Categories', '\uE8FD', 'Product category classification.'),
      tab(NavKeys.MainGroups, 'Product Groups', '\uE8B7', 'Top-level product grouping.'),
      tab(NavKeys.SubGroups, 'Subgroups', '\uE8B7', 'Secondary product grouping.'),
      tab(NavKeys.AssemblyTypes, 'Assembly Types', '\uE8F1', 'Assembly and BOM type definitions.'),
      tab(NavKeys.Machines, 'Equipment', '\uE912', 'Production equipment and work centers.'),
      tab(NavKeys.Warehouses, 'Locations', '\uE7F4', 'Warehouses and storage locations.'),
      tab(NavKeys.SaleUom, 'Sales Units', '\uE7C5', 'Units of measure for sales transactions.'),
      tab(NavKeys.PurchaseUom, 'Purchase Units', '\uE7C5', 'Units of measure for procurement.'),
      tab(NavKeys.AccountLedger, 'Chart of Accounts', '\uE8C8', 'Ledger accounts, customers, and suppliers.'),
      tab(NavKeys.Suppliers, 'Suppliers', '\uE716', 'Supplier and vendor master records.'),
      tab(NavKeys.CompanyRegistration, 'Companies', '\uE731', 'Legal entities, GST, and banking profiles for multi-company operations.'),
      tab(NavKeys.CustomerTypes, 'Party Types', '\uE77B', 'Customer and vendor classification.'),
    ],
    wpfSource: 'Views/MasterDataHubView.xaml',
  },
  {
    hubNavKey: NavKeys.UserAdministration,
    sectionName: 'User Administration',
    sidebarTitle: 'User Administration',
    sidebarIconGlyph: '\uE77B',
    sidebarDescription: 'User accounts, roles, and menu permissions.',
    defaultTabKey: NavKeys.UserRoles,
    tabs: [
      tab(NavKeys.UserRoles, 'Users', '\uE77B', 'User accounts and tenant access.'),
      tab(NavKeys.RoleMaster, 'Roles & Permissions', '\uE72E', 'Roles and menu-level permissions (Administrator role).'),
    ],
    wpfSource: 'Views/UserAdministrationHubView.xaml',
  },
  {
    hubNavKey: NavKeys.Platform,
    sectionName: 'Platform',
    sidebarTitle: 'Platform',
    sidebarIconGlyph: '\uE713',
    sidebarDescription: 'Fiscal years, preferences, print templates, and report builder.',
    defaultTabKey: NavKeys.FinancialYears,
    tabs: [
      tab(NavKeys.FinancialYears, 'Fiscal Years', '\uE787', 'Fiscal periods, year-end close, and period switching.'),
      tab(NavKeys.Settings, 'Preferences', '\uE713', 'Application settings, themes, and defaults.'),
      tab(NavKeys.BillFormatDesigner, 'Print Templates', '\uE8A5', 'Document print layouts for sales, purchase, and inventory.'),
      tab(NavKeys.ReportFormatsCanvas, 'Report Builder', '\uE8B5', 'Custom report layouts and canvas designer.'),
    ],
    wpfSource: 'Views/PlatformHubView.xaml',
  },
  {
    hubNavKey: NavKeys.BulkImport,
    sectionName: 'Bulk Import',
    sidebarTitle: 'Bulk Import',
    sidebarIconGlyph: '\uE8B5',
    sidebarDescription: 'Bulk import master data and transactions from Excel.',
    defaultTabKey: NavKeys.ImportProduct,
    tabs: [
      tab(NavKeys.ImportProduct, 'Products', '\uE8B5', 'Bulk import product master data from Excel.'),
      tab(NavKeys.ImportAccount, 'Accounts', '\uE8C8', 'Bulk import customers and suppliers from Excel.'),
      tab(NavKeys.ImportSalesInvoice, 'Sales Invoices', '\uE8A5', 'Bulk import sales invoices with line items.'),
      tab(NavKeys.ImportPurchaseInvoice, 'Vendor Bills', '\uE719', 'Bulk import purchase invoices with line items.'),
    ],
    wpfSource: 'Views/BulkImportHubView.xaml',
  },
];

export const HUB_BY_NAV_KEY = new Map(HUB_DEFINITIONS.map((h) => [h.hubNavKey, h]));

export const HUB_BY_SECTION = new Map(HUB_DEFINITIONS.map((h) => [h.sectionName, h]));

const moduleKeyToHub = new Map<string, HubDefinition>();
for (const hub of HUB_DEFINITIONS) {
  for (const tabItem of hub.tabs) {
    moduleKeyToHub.set(tabItem.key, hub);
  }
}

export const ALL_HUB_MODULE_NAV_KEYS = HUB_DEFINITIONS.flatMap((h) => h.tabs.map((t) => t.key));

export function getHubDefinition(hubNavKey: string): HubDefinition | undefined {
  return HUB_BY_NAV_KEY.get(hubNavKey);
}

export function getHubForModuleNavKey(key: string): HubDefinition | undefined {
  return moduleKeyToHub.get(key);
}

export function isHubNavKey(key: string): boolean {
  return HUB_BY_NAV_KEY.has(key);
}

export function isHubModuleNavKey(key: string): boolean {
  return moduleKeyToHub.has(key);
}

export function resolveHubTab(hubNavKey: string, key: string): string {
  const hub = getHubDefinition(hubNavKey);
  if (!hub) return key;
  if (hub.tabs.some((t) => t.key === key)) return key;
  return hub.defaultTabKey;
}

export function resolveInitialHubTabs(initialNavKey: string): Record<string, string> {
  const tabs: Record<string, string> = {};
  for (const hub of HUB_DEFINITIONS) {
    tabs[hub.hubNavKey] = resolveHubTab(hub.hubNavKey, initialNavKey);
  }
  return tabs;
}

export function resolveInitialSelectedKey(initialNavKey: string): string {
  const hub = getHubForModuleNavKey(initialNavKey);
  if (hub) return hub.hubNavKey;
  if (isHubNavKey(initialNavKey)) return initialNavKey;
  return initialNavKey;
}

export function getHubTabTitle(hubNavKey: string, tabKey: string): string | undefined {
  return getHubDefinition(hubNavKey)?.tabs.find((t) => t.key === tabKey)?.title;
}

export function isNavItemActive(
  selectedKey: string,
  hubTabs: Record<string, string>,
  itemKey: string,
): boolean {
  if (selectedKey === itemKey) return true;
  const hub = getHubForModuleNavKey(itemKey);
  if (!hub) return false;
  return selectedKey === hub.hubNavKey && hubTabs[hub.hubNavKey] === itemKey;
}
