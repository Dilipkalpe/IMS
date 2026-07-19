using IMS.Models;

namespace IMS.Services;

internal static class HubRegistry
{
    private static HubTabDefinition Tab(string key, string title, string iconGlyph, string description) =>
        new(key, title, iconGlyph, description);

    private static readonly HubDefinition[] Definitions =
    [
        new(
            NavKeys.Sales,
            "Sales",
            "Sales",
            "\uE8A1",
            "Sales orders, delivery notes, invoices, and returns.",
            NavKeys.SalesOrders,
            [
                Tab(NavKeys.SalesOrders, "Sales Orders", "\uE8A1", "Customer orders and fulfillment status."),
                Tab(NavKeys.DeliveryChallan, "Delivery Notes", "\uE7BF", "Outbound delivery documentation against sales orders."),
                Tab(NavKeys.SalesInvoice, "Invoices", "\uE8A5", "Tax invoices and customer billing."),
                Tab(NavKeys.SalesReturn, "Returns", "\uE10F", "Sales returns and credit adjustments.")
            ]),
        new(
            NavKeys.Procurement,
            "Procurement",
            "Procurement",
            "\uE719",
            "Purchase orders, goods receipt, vendor bills, and returns.",
            NavKeys.PurchaseOrders,
            [
                Tab(NavKeys.PurchaseOrders, "Purchase Orders", "\uE719", "Procurement orders for raw materials and supplies."),
                Tab(NavKeys.Grn, "Goods Receipt", "\uE8FB", "Inbound goods receipt and vendor deliveries."),
                Tab(NavKeys.PurchaseInvoice, "Vendor Bills", "\uE8A5", "Supplier invoices and accounts payable."),
                Tab(NavKeys.PurchaseReturn, "Vendor Returns", "\uE10F", "Returns to suppliers and debit adjustments.")
            ]),
        new(
            NavKeys.Manufacturing,
            "Manufacturing",
            "Manufacturing",
            "\uE912",
            "Work orders, bill of materials, and production jobs.",
            NavKeys.ProductionOrders,
            [
                Tab(NavKeys.ProductionOrders, "Work Orders", "\uE912", "Job work list — BOM materials, steps, and stock issue/receipt."),
                Tab(NavKeys.Bom, "Bill of Materials", "\uE8F1", "Product BOM — raw materials, consumables, and revisions.")
            ]),
        new(
            NavKeys.PayrollHr,
            "Payroll & HR",
            "Payroll & HR",
            "\uE716",
            "Employees, attendance, payroll runs, and HR reports.",
            NavKeys.PayrollEmployees,
            [
                Tab(NavKeys.PayrollEmployees, "Employees", "\uE716", "Payroll employee master — salary structure, tax, and statutory IDs."),
                Tab(NavKeys.Attendance, "Time & Attendance", "\uE787", "Daily attendance, leave, and overtime."),
                Tab(NavKeys.PayrollRuns, "Payroll Runs", "\uE8C8", "Process monthly payroll — earnings, deductions, and net pay."),
                Tab(NavKeys.PayrollReports, "Payroll Reports", "\uE9D9", "Payslips, tax summary, and staff hours reports.")
            ]),
        new(
            NavKeys.Inventory,
            "Inventory",
            "Inventory",
            "\uE8AB",
            "Stock activity, transfers, and warehouse movements.",
            NavKeys.StockMovements,
            [
                Tab(NavKeys.StockMovements, "Stock Activity", "\uE8AB", "Inventory receipts, issues, and adjustments."),
                Tab(NavKeys.StockTransfer, "Transfers", "\uE8AB", "Inter-location and warehouse stock transfers.")
            ]),
        new(
            NavKeys.Finance,
            "Finance",
            "Finance",
            "\uE8C8",
            "Payments, collections, banking, and cash management.",
            NavKeys.PaymentVoucher,
            [
                Tab(NavKeys.PaymentVoucher, "Payments", "\uE8C8", "Outgoing vendor and expense payments."),
                Tab(NavKeys.ReceiptVoucher, "Collections", "\uE8C7", "Incoming customer receipts and collections."),
                Tab(NavKeys.DebitNote, "Debit Notes", "\uE8C0", "Debit notes issued to parties."),
                Tab(NavKeys.CreditNote, "Credit Notes", "\uE8C1", "Credit notes issued to parties."),
                Tab(NavKeys.BankEntry, "Banking", "\uE825", "Bank deposits, withdrawals, and transfers."),
                Tab(NavKeys.PettyCash, "Cash Management", "\uE8C4", "Petty cash and imprest expenses.")
            ]),
        new(
            NavKeys.Insights,
            "Insights",
            "Insights",
            "\uE9D9",
            "Operational analytics — ledger, stock, profitability, and performance.",
            NavKeys.LedgerReport,
            [
                Tab(NavKeys.LedgerReport, "General Ledger", "\uE9D9", "Account-wise ledger transactions and balances."),
                Tab(NavKeys.ReorderLevel, "Low Stock", "\uE7BA", "Items at or below reorder thresholds."),
                Tab(NavKeys.ProfitAnalysis, "Profitability", "\uE9D2", "Margin and profit analysis by product and period."),
                Tab(NavKeys.PurchaseAnalysis, "Spend Analysis", "\uE719", "Procurement spend and vendor analysis."),
                Tab(NavKeys.SalesAnalysis, "Sales Performance", "\uE8A1", "Revenue and sales trend analysis."),
                Tab("production-report", "Production Metrics", "\uE912", "Manufacturing output and efficiency metrics.")
            ]),
        new(
            NavKeys.ArAp,
            "AR & AP",
            "AR & AP",
            "\uE8C8",
            "Receivables, payables, and aging analysis.",
            NavKeys.OutstandingReport,
            [
                Tab(NavKeys.OutstandingReport, "Open Balances", "\uE8C8", "Outstanding receivables and payables."),
                Tab(NavKeys.DueDayReport, "Aging (Due Date)", "\uE787", "Aging analysis grouped by due date."),
                Tab(NavKeys.DueAmountReport, "Aging (By Value)", "\uE8C7", "Aging analysis grouped by amount slabs.")
            ]),
        new(
            NavKeys.InventoryInsights,
            "Inventory Insights",
            "Inventory Insights",
            "\uE74C",
            "Opening, closing, and summary inventory reports.",
            NavKeys.OpeningStock,
            [
                Tab(NavKeys.OpeningStock, "Opening Inventory", "\uE74C", "Opening stock by item and location."),
                Tab(NavKeys.ClosingStock, "Closing Inventory", "\uE74C", "Closing stock by item and location."),
                Tab(NavKeys.StockSummary, "Inventory Summary", "\uE9D9", "Detailed inventory movement and valuation summary.")
            ]),
        new(
            NavKeys.FinancialReports,
            "Financial Reports",
            "Financial Reports",
            "\uE8C8",
            "Trial balance, trading account, income statement, and balance sheet.",
            NavKeys.TrialBalance,
            [
                Tab(NavKeys.TrialBalance, "Trial Balance", "\uE8C8", "Trial balance for the period."),
                Tab(NavKeys.TradingAccount, "Trading Statement", "\uE9D2", "Trading account for the period."),
                Tab(NavKeys.ProfitLoss, "Income Statement", "\uE9D2", "Profit and loss for the period."),
                Tab(NavKeys.ProfitLossWithTrading, "Income Statement (Full)", "\uE9D2", "Combined trading and profit & loss statement."),
                Tab(NavKeys.BalanceSheet, "Balance Sheet", "\uE8F1", "Balance sheet as at date.")
            ]),
        new(
            NavKeys.TransactionReports,
            "Transaction Reports",
            "Transaction Reports",
            "\uE8A1",
            "Document registers for sales and purchase transactions.",
            NavKeys.SalesOrderRegister,
            [
                Tab(NavKeys.SalesOrderRegister, "Sales Orders Report", "\uE8A1", "Sales order listing with date and document filters."),
                Tab(NavKeys.SalesDcRegister, "Delivery Notes Report", "\uE7BF", "Delivery note listing with date and document filters."),
                Tab(NavKeys.SalesInvoiceRegister, "Invoices Report", "\uE8A5", "Sales invoice listing with date and document filters."),
                Tab(NavKeys.SalesReturnRegister, "Returns Report", "\uE10F", "Sales return listing with date and document filters."),
                Tab(NavKeys.PurchaseOrderRegister, "Purchase Orders Report", "\uE719", "Purchase order listing with date and document filters."),
                Tab(NavKeys.GrnRegister, "Goods Receipt Report", "\uE8FB", "Goods receipt listing with date and document filters."),
                Tab(NavKeys.PurchaseInvoiceRegister, "Vendor Bills Report", "\uE8A5", "Vendor bill listing with date and document filters."),
                Tab(NavKeys.PurchaseReturnRegister, "Vendor Returns Report", "\uE10F", "Vendor return listing with date and document filters.")
            ]),
        new(
            NavKeys.MasterData,
            "Master Data",
            "Master Data",
            "\uE7B8",
            "Products, accounts, locations, and reference master data.",
            NavKeys.Products,
            [
                Tab(NavKeys.Products, "Product Catalog", "\uE7B8", "Products — raw materials, components, and finished goods."),
                Tab(NavKeys.ProductTypes, "Categories", "\uE8FD", "Product category classification."),
                Tab(NavKeys.MainGroups, "Product Groups", "\uE8B7", "Top-level product grouping."),
                Tab(NavKeys.SubGroups, "Subgroups", "\uE8B7", "Secondary product grouping."),
                Tab(NavKeys.AssemblyTypes, "Assembly Types", "\uE8F1", "Assembly type master."),
                Tab(NavKeys.Machines, "Equipment", "\uE912", "Production equipment and work centers."),
                Tab(NavKeys.Warehouses, "Locations", "\uE7F4", "Warehouses and storage locations."),
                Tab(NavKeys.SaleUom, "Sales Units", "\uE7C5", "Units of measure for sales transactions."),
                Tab(NavKeys.PurchaseUom, "Purchase Units", "\uE7C5", "Units of measure for procurement."),
                Tab(NavKeys.AccountLedger, "Chart of Accounts", "\uE8C8", "Chart of accounts and ledger master."),
                Tab(NavKeys.Suppliers, "Suppliers", "\uE716", "Supplier and vendor master records."),
                Tab(NavKeys.CompanyRegistration, "Companies", "\uE731", "Legal entities, GST, and banking profiles for multi-company operations."),
                Tab(NavKeys.CustomerTypes, "Party Types", "\uE77B", "Customer and vendor classification.")
            ]),
        new(
            NavKeys.UserAdministration,
            "User Administration",
            "User Administration",
            "\uE77B",
            "User accounts, roles, and menu permissions.",
            NavKeys.UserRoles,
            [
                Tab(NavKeys.UserRoles, "Users", "\uE77B", "Application users and login accounts."),
                Tab(NavKeys.RoleMaster, "Roles & Permissions", "\uE72E", "Roles and menu-level permissions (Administrator role).")
            ]),
        new(
            NavKeys.Platform,
            "Platform",
            "Platform",
            "\uE713",
            "Fiscal years, preferences, print templates, and report builder.",
            NavKeys.FinancialYears,
            [
                Tab(NavKeys.FinancialYears, "Fiscal Years", "\uE787", "Fiscal periods, year-end close, and period switching."),
                Tab(NavKeys.Settings, "Preferences", "\uE713", "Application settings, themes, and defaults."),
                Tab(NavKeys.BillFormatDesigner, "Print Templates", "\uE8A5", "Document print layouts for sales, purchase, and inventory."),
                Tab(NavKeys.ReportFormatsCanvas, "Report Builder", "\uE8B5", "Custom report layouts and canvas designer.")
            ]),
        new(
            NavKeys.BulkImport,
            "Bulk Import",
            "Bulk Import",
            "\uE8B5",
            "Bulk import master data and transactions from Excel.",
            NavKeys.ImportProduct,
            [
                Tab(NavKeys.ImportProduct, "Products", "\uE8B5", "Bulk import product master data from Excel."),
                Tab(NavKeys.ImportAccount, "Accounts", "\uE8C8", "Bulk import customers and suppliers from Excel."),
                Tab(NavKeys.ImportSalesInvoice, "Sales Invoices", "\uE8A5", "Bulk import sales invoices with line items."),
                Tab(NavKeys.ImportPurchaseInvoice, "Vendor Bills", "\uE719", "Bulk import purchase invoices with line items.")
            ])
    ];

    private static readonly Dictionary<string, HubDefinition> ByHubNavKey =
        Definitions.ToDictionary(h => h.HubNavKey, StringComparer.Ordinal);

    private static readonly Dictionary<string, HubDefinition> BySectionName =
        Definitions.ToDictionary(h => h.SectionName, StringComparer.Ordinal);

    private static readonly Dictionary<string, HubDefinition> ModuleKeyToHub;

    static HubRegistry()
    {
        ModuleKeyToHub = new Dictionary<string, HubDefinition>(StringComparer.Ordinal);
        foreach (var hub in Definitions)
        {
            foreach (var tab in hub.Tabs)
                ModuleKeyToHub[tab.Key] = hub;
        }
    }

    public static IReadOnlyList<HubDefinition> All => Definitions;

    public static HubDefinition? GetHub(string hubNavKey) =>
        ByHubNavKey.GetValueOrDefault(hubNavKey);

    public static HubDefinition? GetHubBySection(string sectionName) =>
        BySectionName.GetValueOrDefault(sectionName);

    public static HubDefinition? GetHubForModuleNavKey(string moduleKey) =>
        ModuleKeyToHub.GetValueOrDefault(moduleKey);

    public static bool IsHubNavKey(string key) => ByHubNavKey.ContainsKey(key);

    public static bool IsHubModuleNavKey(string key) => ModuleKeyToHub.ContainsKey(key);

    public static string ResolveHubTab(string hubNavKey, string key)
    {
        var hub = GetHub(hubNavKey);
        if (hub is null)
            return key;

        return hub.Tabs.Any(t => string.Equals(t.Key, key, StringComparison.Ordinal))
            ? key
            : hub.DefaultTabKey;
    }

    public static string? GetHubTabTitle(string hubNavKey, string tabKey) =>
        GetHub(hubNavKey)?.Tabs.FirstOrDefault(t => string.Equals(t.Key, tabKey, StringComparison.Ordinal))?.Title;

    public static string ResolveInitialSelectedKey(string initialNavKey)
    {
        var hub = GetHubForModuleNavKey(initialNavKey);
        if (hub is not null)
            return hub.HubNavKey;

        return IsHubNavKey(initialNavKey) ? initialNavKey : initialNavKey;
    }

    public static bool IsNavItemActive(string selectedSidebarKey, IReadOnlyDictionary<string, string> hubTabs, string itemKey)
    {
        if (string.Equals(selectedSidebarKey, itemKey, StringComparison.Ordinal))
            return true;

        var hub = GetHubForModuleNavKey(itemKey);
        if (hub is null)
            return false;

        return string.Equals(selectedSidebarKey, hub.HubNavKey, StringComparison.Ordinal)
               && string.Equals(hubTabs.GetValueOrDefault(hub.HubNavKey, hub.DefaultTabKey), itemKey, StringComparison.Ordinal);
    }
}
