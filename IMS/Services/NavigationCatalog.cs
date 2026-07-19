using IMS.Helpers;
using IMS.Models;
using IMS.ViewModels;

namespace IMS.Services;

internal static class NavigationCatalog
{
    //private const string DashboardSection = "Dashboard / Analytics";
    //private const string SalesSection = "Sales & Distribution";
    //private const string PurchaseSection = "Procurement / Purchase";
    //private const string ProductionSection = "Production / Manufacturing";
    //private const string InventorySection = "Inventory & Warehouse";
    //private const string FinanceSection = "Finance & Accounts";
    //private const string MisSection = "MIS Reports";
    //private const string ReceivablesSection = "Receivables / Payables";
    //private const string InvReportsSection = "Inventory Reports";
    //private const string FinancialSection = "Financial Statements";
    //private const string DayBooksSection = "Day Books & Registers";
    //private const string AdminSection = "Administration / Master Setup";

    private const string DashboardSection = "Overview";
    private const string SalesSection = "Sales";
    private const string PurchaseSection = "Procurement";
    private const string ProductionSection = "Manufacturing";
    private const string InventorySection = "Inventory";
    private const string FinanceSection = "Finance";
    private const string MisSection = "Insights";
    private const string ReceivablesSection = "AR & AP";
    private const string InvReportsSection = "Inventory Insights";
    private const string FinancialSection = "Financial Reports";
    private const string DayBooksSection = "Transaction Reports";
    private const string AdminSection = "Master Data";
    private const string SecuritySection = "User Administration";
    private const string ItSecuritySection = "Platform";
    private const string ImportSection = "Bulk Import";
    private const string PayrollSection = "Payroll & HR";

    private static readonly NavDefinition[] Definitions =
    [
        // Dashboard / Analytics
        new(NavKeys.Dashboard, "Overview", DashboardSection, "\uE80F",
            "KPIs, charts, and operational snapshot across your organization.",
            "Metric", "Value", "Trend", "Period"),

        // Sales & Distribution
        new(NavKeys.SalesOrders, "Sales Orders", SalesSection, "\uE8A1",
            "Customer orders and fulfillment status.",
            "SO No", "Customer", "Amount", "Status"),
        new(NavKeys.DeliveryChallan, "Delivery Notes", SalesSection, "\uE7BF",
            "Outbound delivery documentation against sales orders.",
            "DC No", "Customer", "Date", "Status"),
        new(NavKeys.SalesInvoice, "Invoices", SalesSection, "\uE8A5",
            "Tax invoices and customer billing.",
            "Invoice No", "Customer", "Amount", "Status"),
        new(NavKeys.SalesReturn, "Returns", SalesSection, "\uE10F",
            "Sales returns and credit adjustments.",
            "Return No", "Customer", "Amount", "Status"),

        new(NavKeys.PurchaseOrders, "Purchase Orders", PurchaseSection, "\uE719",
            "Procurement orders for raw materials and supplies (same layout as sales orders).",
            "PO No", "Supplier", "Amount", "Status"),
        new(NavKeys.Grn, "Goods Receipt", PurchaseSection, "\uE8FB",
            "Inbound goods receipt and vendor deliveries.",
            "GRN No", "Supplier", "Date", "Status"),
        new(NavKeys.PurchaseInvoice, "Vendor Bills", PurchaseSection, "\uE8A5",
            "Supplier invoices and accounts payable.",
            "Invoice No", "Supplier", "Amount", "Status"),
        new(NavKeys.PurchaseReturn, "Vendor Returns", PurchaseSection, "\uE10F",
            "Returns to suppliers and debit adjustments.",
            "Return No", "Supplier", "Amount", "Status"),

        // Production / Manufacturing
        new(NavKeys.ProductionOrders, "Work Orders", ProductionSection, "\uE912",
            "Job work list — BOM materials, steps, and stock issue/receipt.",
            "Job Work No", "Item", "Qty", "Status"),
        new(NavKeys.Bom, "Bill of Materials", ProductionSection, "\uE8F1",
            "Product BOM — raw materials, consumables, and revisions.",
            "Product", "Name", "Lines", "Revision"),

        // Payroll & HR
        new(NavKeys.PayrollEmployees, "Employees", PayrollSection, "\uE716",
            "Payroll employee master — salary structure, tax, and statutory IDs.",
            "Code", "Name", "Department", "Basic Salary"),
        new(NavKeys.Attendance, "Time & Attendance", PayrollSection, "\uE787",
            "Daily attendance, leave, and overtime.",
            "Date", "Employee", "Name", "Status"),
        new(NavKeys.PayrollRuns, "Payroll Runs", PayrollSection, "\uE8C8",
            "Process monthly payroll — earnings, deductions, and net pay.",
            "Run No", "Period", "Net Pay", "Status"),
        new(NavKeys.PayrollReports, "Payroll Reports", PayrollSection, "\uE9D9",
            "Payslips, tax summary, and staff hours reports.",
            "Report", "Period", "Output", "Status"),

        // Inventory & Warehouse
        //new(NavKeys.StockLevels, "Stock Levels", InventorySection, "\uE74C",
        //    "On-hand quantity by product and warehouse location.",
        //    "SKU", "Warehouse", "On Hand", "Available"),
        //new(NavKeys.Warehouses, "Warehouses", InventorySection, "\uE7F4",
        //    "Warehouse and storage location master.",
        //    "Code", "Warehouse", "Location", "Status"),
        new(NavKeys.StockMovements, "Stock Activity", InventorySection, "\uE8AB",
            "Inventory receipts, issues, and adjustments.",
            "Doc No", "Type", "SKU", "Qty"),
        new(NavKeys.StockTransfer, "Transfers", InventorySection, "\uE8AB",
            "Inter-location and warehouse stock transfers.",
            "Transfer No", "From WH", "To WH", "Status"),
        //new("unit-conversion", "Unit Conversion", InventorySection, "\uE8D4",
        //    "Unit conversion between UOMs.",
        //    "SKU", "From UOM", "To UOM", "Factor"),
        //new("item-adjustment", "Item Adjustment", InventorySection, "\uE70F",
        //    "Inventory quantity adjustments.",
        //    "Adj No", "SKU", "Qty", "Reason"),

        // Finance & Accounts
        new(NavKeys.PaymentVoucher, "Payments", FinanceSection, "\uE8C8",
            "Outgoing vendor and expense payments.",
            "Voucher No", "Party", "Amount", "Status"),
        new(NavKeys.ReceiptVoucher, "Collections", FinanceSection, "\uE8C7",
            "Incoming customer receipts and collections.",
            "Voucher No", "Party", "Amount", "Status"),
        new(NavKeys.DebitNote, "Debit Notes", FinanceSection, "\uE8C0",
            "Debit notes issued to parties.",
            "Note No", "Party", "Amount", "Status"),
        new(NavKeys.CreditNote, "Credit Notes", FinanceSection, "\uE8C1",
            "Credit notes issued to parties.",
            "Note No", "Party", "Amount", "Status"),
        new(NavKeys.BankEntry, "Banking", FinanceSection, "\uE825",
            "Bank deposits, withdrawals, and transfers.",
            "Entry No", "Type", "Amount", "Status"),
        new(NavKeys.PettyCash, "Cash Management", FinanceSection, "\uE8C4",
            "Petty cash and imprest expenses.",
            "Entry No", "Category", "Amount", "Status"),

        // MIS Reports
        new(NavKeys.LedgerReport, "General Ledger", MisSection, "\uE9D9",
            "Account-wise ledger transactions and balances.",
            "Account", "Date", "Debit", "Credit"),
        new(NavKeys.ReorderLevel, "Low Stock", MisSection, "\uE7BA",
            "Items at or below reorder thresholds.",
            "SKU", "Warehouse", "On Hand", "Reorder"),
        new(NavKeys.ProfitAnalysis, "Profitability", MisSection, "\uE9D2",
            "Margin and profit analysis by product and period.",
            "SKU", "Period", "Revenue", "Margin"),
        new(NavKeys.PurchaseAnalysis, "Spend Analysis", MisSection, "\uE719",
            "Procurement spend and vendor analysis.",
            "Supplier", "Period", "Amount", "Qty"),
        new(NavKeys.SalesAnalysis, "Sales Performance", MisSection, "\uE8A1",
            "Revenue and sales trend analysis.",
            "Customer", "Period", "Amount", "Qty"),
        new("production-report", "Production Metrics", MisSection, "\uE912",
            "Manufacturing output and efficiency metrics.",
            "MO No", "Product", "Output", "Efficiency"),

        // Receivables / Payables
        new(NavKeys.OutstandingReport, "Open Balances", ReceivablesSection, "\uE8C8",
            "Outstanding receivables and payables.",
            "Party", "Type", "Amount", "Age"),
        new(NavKeys.DueDayReport, "Aging (Due Date)", ReceivablesSection, "\uE787",
            "Aging analysis grouped by due date.",
            "Party", "Due Date", "Amount", "Days"),
        new(NavKeys.DueAmountReport, "Aging (By Value)", ReceivablesSection, "\uE8C7",
            "Aging analysis grouped by amount slabs.",
            "Party", "Slab", "Amount", "Count"),

        // Inventory Reports
        new("opening-stock", "Opening Inventory", InvReportsSection, "\uE74C",
            "Opening stock by item and location.",
            "SKU", "Warehouse", "Opening Qty", "Value"),
        new("closing-stock", "Closing Inventory", InvReportsSection, "\uE74C",
            "Closing stock by item and location.",
            "SKU", "Warehouse", "Closing Qty", "Value"),
        new(NavKeys.StockSummary, "Inventory Summary", InvReportsSection, "\uE9D9",
            "Detailed inventory movement and valuation summary.",
            "SKU", "Warehouse", "In", "Out"),

        // Financial Statements
        new(NavKeys.TrialBalance, "Trial Balance", FinancialSection, "\uE8C8",
            "Trial balance for the period.",
            "Account", "Debit", "Credit", "Balance"),
        new(NavKeys.TradingAccount, "Trading Statement", FinancialSection, "\uE9D2",
            "Trading account for the period.",
            "Head", "Debit", "Credit", "Balance"),
        new(NavKeys.ProfitLoss, "Income Statement", FinancialSection, "\uE9D2",
            "Profit and loss for the period.",
            "Head", "Debit", "Credit", "Balance"),
        new(NavKeys.ProfitLossWithTrading, "Income Statement (Full)", FinancialSection, "\uE9D2",
            "Combined trading and profit & loss statement.",
            "Head", "Debit", "Credit", "Balance"),
        new(NavKeys.BalanceSheet, "Balance Sheet", FinancialSection, "\uE8F1",
            "Balance sheet as at date.",
            "Head", "Assets", "Liabilities", "Amount"),
        // Registers
        new(NavKeys.SalesOrderRegister, "Sales Orders Report", DayBooksSection, "\uE8A1",
            "Sales order listing with date and document filters.",
            "Bill No", "Date", "Customer", "Amount"),
        new(NavKeys.SalesDcRegister, "Delivery Notes Report", DayBooksSection, "\uE7BF",
            "Delivery note listing with date and document filters.",
            "Bill No", "Date", "Customer", "Amount"),
        new(NavKeys.SalesInvoiceRegister, "Invoices Report", DayBooksSection, "\uE8A5",
            "Sales invoice listing with date and document filters.",
            "Bill No", "Date", "Customer", "Amount"),
        new(NavKeys.SalesReturnRegister, "Returns Report", DayBooksSection, "\uE10F",
            "Sales return listing with date and document filters.",
            "Bill No", "Date", "Customer", "Amount"),
        new(NavKeys.PurchaseOrderRegister, "Purchase Orders Report", DayBooksSection, "\uE719",
            "Purchase order listing with date and document filters.",
            "Bill No", "Date", "Supplier", "Amount"),
        new(NavKeys.GrnRegister, "Goods Receipt Report", DayBooksSection, "\uE8FB",
            "Goods receipt listing with date and document filters.",
            "Bill No", "Date", "Supplier", "Amount"),
        new(NavKeys.PurchaseInvoiceRegister, "Vendor Bills Report", DayBooksSection, "\uE8A5",
            "Vendor bill listing with date and document filters.",
            "Bill No", "Date", "Supplier", "Amount"),
        new(NavKeys.PurchaseReturnRegister, "Vendor Returns Report", DayBooksSection, "\uE10F",
            "Vendor return listing with date and document filters.",
            "Bill No", "Date", "Supplier", "Amount"),

        // Administration / Master Setup
        new(NavKeys.Products, "Product Catalog", AdminSection, "\uE7B8",
            "Products — raw materials, components, and finished goods.",
            "SKU", "Name", "Category", "Unit"),
        new(NavKeys.ProductTypes, "Categories", AdminSection, "\uE8FD",
            "Product category classification.",
            "Code", "Type", "Description", "Status"),
        new(NavKeys.MainGroups, "Product Groups", AdminSection, "\uE8B7",
            "Top-level product grouping.",
            "Code", "Main Group", "Description", "Status"),
        new(NavKeys.SubGroups, "Subgroups", AdminSection, "\uE8B7",
            "Secondary product grouping.",
            "Code", "Sub Group", "Main Group", "Status"),
        new(NavKeys.AssemblyTypes, "Assembly Types", AdminSection, "\uE8F1",
            "Assembly type master.",
            "Code", "Assembly Type", "Description", "Status"),
        new(NavKeys.Machines, "Equipment", AdminSection, "\uE912",
            "Production equipment and work centers.",
            "Code", "Machine Name", "Description", "Status"),
        new(NavKeys.Warehouses, "Locations", AdminSection, "\uE7F4",
            "Warehouses and storage locations.",
            "Code", "Warehouse Name", "Location", "Status"),
        new(NavKeys.SaleUom, "Sales Units", AdminSection, "\uE7C5",
            "Units of measure for sales transactions.",
            "Code", "UOM", "Symbol", "Status"),
        new(NavKeys.PurchaseUom, "Purchase Units", AdminSection, "\uE7C5",
            "Units of measure for procurement.",
            "Code", "UOM", "Symbol", "Status"),
        new(NavKeys.AccountLedger, "Chart of Accounts", AdminSection, "\uE8C8",
            "Chart of accounts and ledger master.",
            "Code", "Account", "Group", "Status"),
        new(NavKeys.Suppliers, "Suppliers", AdminSection, "\uE716",
            "Supplier and vendor master records.",
            "Code", "Supplier", "GSTIN", "Status"),
        new(NavKeys.CompanyRegistration, "Companies", AdminSection, "\uE731",
            "Legal entities, GST, and banking profiles for multi-company operations.",
            "Code", "Business Name", "GSTIN", "Default"),
        new(NavKeys.CustomerTypes, "Party Types", AdminSection, "\uE77B",
            "Customer and vendor classification.",
            "Type Code", "Type Name", "Description", "Status"),
        new(NavKeys.UserRoles, "Users", SecuritySection, "\uE77B",
            "Application users and login accounts.",
            "User", "Role", "Department", "Status"),
        new(NavKeys.RoleMaster, "Roles & Permissions", SecuritySection, "\uE72E",
            "Roles and menu-level permissions (Administrator role).",
            "Role", "Status", "Menus", "Actions"),

        new(NavKeys.FinancialYears, "Fiscal Years", ItSecuritySection, "\uE787",
            "Fiscal periods, year-end close, and period switching.",
            "Year", "Start", "End", "Database"),
        new(NavKeys.Settings, "Preferences", ItSecuritySection, "\uE713",
            "Application settings, themes, and defaults.",
            "Setting", "Value", "Category", "Status"),
        new(NavKeys.BillFormatDesigner, "Print Templates", ItSecuritySection, "\uE8A5",
            "Document print layouts for sales, purchase, and inventory.",
            "Code", "Format Name", "Document Type", "Default"),
        new(NavKeys.ReportFormatsCanvas, "Report Builder", ItSecuritySection, "\uE8B5",
            "Custom report layouts and canvas designer.",
            "Code", "Name", "Transaction", "Default"),

        new(NavKeys.ImportProduct, "Products", ImportSection, "\uE8B5",
            "Bulk import product master data from Excel.",
            "Step", "Action", "Status", "Result"),
        new(NavKeys.ImportAccount, "Accounts", ImportSection, "\uE8C8",
            "Bulk import customers and suppliers from Excel.",
            "Step", "Action", "Status", "Result"),
        new(NavKeys.ImportSalesInvoice, "Sales Invoices", ImportSection, "\uE8A5",
            "Bulk import sales invoices with line items.",
            "Step", "Action", "Status", "Result"),
        new(NavKeys.ImportPurchaseInvoice, "Vendor Bills", ImportSection, "\uE719",
            "Bulk import purchase invoices with line items.",
            "Step", "Action", "Status", "Result")
    ];

    public static List<NavigationItem> Build() =>
        Definitions.Select(ToNavigationItem).ToList();

    private static NavigationItem ToNavigationItem(NavDefinition def) => new()
    {
        Key = def.Key,
        Title = def.Title,
        IconGlyph = def.IconGlyph,
        Section = def.Section,
        Description = def.Description,
        CreateViewModel = host => CreateViewModel(host, def)
    };

    private static object CreateViewModel(MainViewModel host, NavDefinition def) => def.Key switch
    {
        NavKeys.Dashboard => new DashboardViewModel(host),
        NavKeys.Products => new ProductsViewModel(host),
        NavKeys.ProductTypes => new ProductTypesViewModel(host),
        NavKeys.MainGroups => new ProductMainGroupsViewModel(host),
        NavKeys.SubGroups => new ProductSubGroupsViewModel(host),
        NavKeys.AssemblyTypes => new AssemblyTypesViewModel(host),
        NavKeys.Machines => new MachinesViewModel(host),
        NavKeys.Warehouses => new WarehousesViewModel(host),
        NavKeys.SaleUom => new SaleUomsViewModel(host),
        NavKeys.PurchaseUom => new ClassificationMasterViewModel(host, ClassificationMasterKind.PurchaseUom),
        NavKeys.StockLevels => new StockLevelsViewModel(),
        NavKeys.StockMovements => new StockMovementReportViewModel(),
        NavKeys.StockTransfer => new StockTransfersViewModel(host),
        NavKeys.Suppliers => new SuppliersViewModel(host),
        NavKeys.PurchaseOrders => new PurchaseOrdersViewModel(host),
        NavKeys.Grn => new PurchaseGrnsViewModel(host),
        NavKeys.PurchaseInvoice => new PurchaseInvoicesViewModel(host),
        NavKeys.PurchaseReturn => new PurchaseReturnsViewModel(host),
        NavKeys.SalesOrders => new SalesOrdersViewModel(host),
        NavKeys.DeliveryChallan => new DeliveryChallansViewModel(host),
        NavKeys.SalesInvoice => new SalesInvoicesViewModel(host),
        NavKeys.SalesReturn => new SalesReturnsViewModel(host),
        NavKeys.Bom => new BomViewModel(host),
        NavKeys.ProductionOrders => new ProductionOrdersViewModel(host),
        NavKeys.PayrollEmployees => new PayrollEmployeesViewModel(host),
        NavKeys.Attendance => new AttendanceViewModel(host),
        NavKeys.PayrollRuns => new PayrollRunsViewModel(host),
        NavKeys.PayrollReports => new PayrollReportsViewModel(host),
        NavKeys.WorkCenters => new WorkCentersViewModel(),
        NavKeys.Settings => new SettingsViewModel(host),
        NavKeys.BillFormatDesigner => new BillFormatsViewModel(host),
        NavKeys.ReportFormatsCanvas => new ReportFormatsViewModel(host),
        NavKeys.AccountLedger => new AccountLedgerViewModel(host),
        NavKeys.CompanyRegistration => new CompanyRegistrationsViewModel(host),
        NavKeys.CustomerTypes => new CustomerTypesViewModel(host),
        NavKeys.UserRoles => new UsersViewModel(host),
        NavKeys.RoleMaster => new RoleMasterViewModel(host),
        NavKeys.FinancialYears => new FinancialYearManagementViewModel(host),
        NavKeys.PaymentVoucher => new PaymentVouchersViewModel(host),
        NavKeys.ReceiptVoucher => new ReceiptVouchersViewModel(host),
        NavKeys.CreditNote => new CreditNotesViewModel(host),
        NavKeys.DebitNote => new DebitNotesViewModel(host),
        NavKeys.PettyCash => new CashEntriesViewModel(host),
        NavKeys.BankEntry => new BankEntriesViewModel(host),
        NavKeys.OpeningStock => new OpeningStockReportViewModel(),
        NavKeys.ClosingStock => new ClosingStockReportViewModel(),
        NavKeys.StockSummary => new StockDetailsSummaryReportViewModel(),
        NavKeys.LedgerReport => new LedgerReportViewModel(),
        NavKeys.TrialBalance => new TrialBalanceReportViewModel(),
        NavKeys.TradingAccount => new TradingAccountReportViewModel(),
        NavKeys.ProfitLoss => new ProfitLossReportViewModel(),
        NavKeys.ProfitLossWithTrading => new ProfitLossWithTradingReportViewModel(),
        NavKeys.BalanceSheet => new BalanceSheetReportViewModel(),
        NavKeys.ReorderLevel => new ReorderLevelReportViewModel(),
        NavKeys.ProfitAnalysis => new ProfitAnalysisReportViewModel(),
        NavKeys.PurchaseAnalysis => new PurchaseAnalysisReportViewModel(),
        NavKeys.SalesAnalysis => new SalesAnalysisReportViewModel(),
        NavKeys.OutstandingReport => new OutstandingReportViewModel(),
        NavKeys.DueDayReport => new DueDayReportViewModel(),
        NavKeys.DueAmountReport => new DueAmountReportViewModel(),
        NavKeys.SalesOrderRegister => new DocumentRegisterReportViewModel("sales_order", "Sales Orders Report", "Customer"),
        NavKeys.SalesDcRegister => new DocumentRegisterReportViewModel("delivery_challan", "Delivery Notes Report", "Customer"),
        NavKeys.SalesInvoiceRegister => new DocumentRegisterReportViewModel("sales_invoice", "Invoices Report", "Customer"),
        NavKeys.SalesReturnRegister => new DocumentRegisterReportViewModel("sales_return", "Returns Report", "Customer"),
        NavKeys.PurchaseOrderRegister => new DocumentRegisterReportViewModel("purchase_order", "Purchase Orders Report", "Supplier"),
        NavKeys.GrnRegister => new DocumentRegisterReportViewModel("grn", "Goods Receipt Report", "Supplier"),
        NavKeys.PurchaseInvoiceRegister => new DocumentRegisterReportViewModel("purchase_invoice", "Vendor Bills Report", "Supplier"),
        NavKeys.PurchaseReturnRegister => new DocumentRegisterReportViewModel("purchase_return", "Vendor Returns Report", "Supplier"),
        NavKeys.ImportProduct => new ImportPageViewModel(host, "products", "Product", NavKeys.Products, "Product Catalog"),
        NavKeys.ImportAccount => new ImportPageViewModel(host, "accounts", "Account", NavKeys.AccountLedger, "Chart of Accounts"),
        NavKeys.ImportSalesInvoice => new ImportPageViewModel(host, "sales-invoices", "Sales Invoice", NavKeys.SalesInvoice, "Invoices"),
        NavKeys.ImportPurchaseInvoice => new ImportPageViewModel(host, "purchase-invoices", "Purchase Invoice", NavKeys.PurchaseInvoice, "Vendor Bills"),
        _ => MockPageBuilder.Create(def)
    };
}
