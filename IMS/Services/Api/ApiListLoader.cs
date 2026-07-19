using System.Windows;
using System.Windows.Threading;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api.Dtos;
using IMS.ViewModels;

namespace IMS.Services.Api;

public static class ApiListLoader
{
    private static async Task<bool> EnsureApiAvailableAsync(int attempts = 8)
    {
        for (var attempt = 0; attempt < attempts; attempt++)
        {
            if (ImsApiClient.IsAvailable || await ImsApiClient.CheckHealthAsync())
                return true;

            if (attempt < attempts - 1)
                await Task.Delay(350);
        }

        return false;
    }

    public static void RefreshCurrentPage(object? viewModel)
    {
        switch (viewModel)
        {
            case DashboardViewModel dashboard:
                _ = dashboard.EnsureLoadedAsync();
                break;
            case ProductsViewModel products:
                _ = products.EnsureApiLoadAsync();
                break;
            case ProductTypesViewModel productTypes:
                RefreshProductTypes(productTypes);
                break;
            case ProductMainGroupsViewModel mainGroups:
                RefreshProductMainGroups(mainGroups);
                break;
            case ProductSubGroupsViewModel subGroups:
                RefreshProductSubGroups(subGroups);
                break;
            case AssemblyTypesViewModel assemblyTypes:
                RefreshAssemblyTypes(assemblyTypes);
                break;
            case MachinesViewModel machines:
                RefreshMachines(machines);
                break;
            case PayrollEmployeesViewModel payrollEmployees:
                RefreshPayrollEmployees(payrollEmployees);
                break;
            case AttendanceViewModel attendance:
                RefreshAttendance(attendance);
                break;
            case PayrollRunsViewModel payrollRuns:
                RefreshPayrollRuns(payrollRuns);
                break;
            case WarehousesViewModel warehouses:
                RefreshWarehouses(warehouses);
                break;
            case BillFormatsViewModel billFormats:
                RefreshBillFormats(billFormats);
                break;
            case ReportFormatsViewModel reportFormats:
                RefreshReportFormats(reportFormats);
                break;
            case SaleUomsViewModel saleUoms:
                RefreshSaleUoms(saleUoms);
                break;
            case CompanyRegistrationsViewModel companies:
                RefreshCompanies(companies);
                break;
            case CustomerTypesViewModel customerTypes:
                RefreshCustomerTypes(customerTypes);
                break;
            case AccountLedgerViewModel accounts:
                RefreshAccounts(accounts);
                break;
            case UsersViewModel users:
                RefreshUsers(users);
                break;
            case PaymentVouchersViewModel paymentVouchers:
                RefreshPaymentVouchers(paymentVouchers);
                break;
            case ReceiptVouchersViewModel receiptVouchers:
                RefreshReceiptVouchers(receiptVouchers);
                break;
            case CreditNotesViewModel creditNotes:
                RefreshCreditNotes(creditNotes);
                break;
            case DebitNotesViewModel debitNotes:
                RefreshDebitNotes(debitNotes);
                break;
            case CashEntriesViewModel cashEntries:
                RefreshCashEntries(cashEntries);
                break;
            case BankEntriesViewModel bankEntries:
                RefreshBankEntries(bankEntries);
                break;
            case SalesOrdersViewModel salesOrders:
                salesOrders.OnPageViewLoaded();
                break;
            case SalesInvoicesViewModel salesInvoices:
                _ = salesInvoices.EnsureApiLoadAsync();
                break;
            case SalesReturnsViewModel salesReturns:
                _ = salesReturns.EnsureApiLoadAsync();
                break;
            case DeliveryChallansViewModel deliveryChallans:
                _ = deliveryChallans.EnsureApiLoadAsync();
                break;
            case PurchaseOrdersViewModel purchaseOrders:
                _ = purchaseOrders.EnsureApiLoadAsync();
                break;
            case PurchaseInvoicesViewModel purchaseInvoices:
                _ = purchaseInvoices.EnsureApiLoadAsync();
                break;
            case PurchaseReturnsViewModel purchaseReturns:
                _ = purchaseReturns.EnsureApiLoadAsync();
                break;
            case PurchaseGrnsViewModel grns:
                _ = grns.EnsureApiLoadAsync();
                break;
            case StockTransfersViewModel stockTransfers:
                RefreshStockTransfers(stockTransfers);
                break;
            case ProductionOrdersViewModel productionOrders:
                RefreshProductionOrders(productionOrders);
                break;
            case BomViewModel bomList:
                RefreshBoms(bomList);
                break;
            case MockPageViewModel mockPage:
                _ = mockPage.EnsureApiLoadAsync();
                break;
            default:
                if (viewModel is IPageViewLoadAware loadAware)
                    loadAware.OnPageViewLoaded();
                break;
        }
    }

    public static void RefreshSalesList(MockPageViewModel page, SalesEntryType type) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            if (type == SalesEntryType.SalesOrder)
            {
                await LoadSalesOrdersAsync(page);
                return;
            }

            if (type is SalesEntryType.DeliveryChallan or SalesEntryType.SalesInvoice or SalesEntryType.SalesReturn)
            {
                await LoadSalesDocumentsAsync(page, type);
                return;
            }

            var docs = await ImsApiClient.GetDocumentsAsync(ApiDocumentMapper.ToApiType(type));
            page.ReplaceAllRows(docs
                .Where(d => d is not null)
                .Select(d => ApiDocumentMapper.ToMockRow(d, page.Col3Header, isSales: true)));
        });

    public static void RefreshSalesDocuments(MockPageViewModel page, SalesEntryType type) =>
        ApiUiHelper.RunWithApiFireAndForget(async () => await LoadSalesDocumentsAsync(page, type));

    internal static async Task LoadSalesDocumentsAsync(MockPageViewModel page, SalesEntryType type)
    {
        if (!await EnsureApiAvailableAsync())
            return;

        if (page is SalesDocumentListViewModelBase listPage)
        {
            await listPage.ReloadSalesDocumentsAsync();
            return;
        }

        var items = await ImsApiClient.GetSalesDocumentsAsync(type);
        var stats = await ImsApiClient.GetSalesDocumentStatsAsync(type);

        await RunOnUiAsync(() =>
        {
            page.ReplaceAllRows(items.Select(d => ApiDocumentMapper.SalesDocumentToMockRow(d, page.Col3Header)));
            if (page is SalesDocumentListViewModelBase legacyList && stats is not null)
                legacyList.RefreshStats(stats);
        });
    }

    public static void RefreshPurchaseList(MockPageViewModel page, PurchaseEntryType type) =>
        ApiUiHelper.RunWithApiFireAndForget(async () => await LoadPurchaseDocumentsAsync(page, type));

    public static void RefreshPurchaseDocuments(MockPageViewModel page, PurchaseEntryType type) =>
        RefreshPurchaseList(page, type);

    internal static async Task LoadPurchaseDocumentsAsync(MockPageViewModel page, PurchaseEntryType type)
    {
        if (!await EnsureApiAvailableAsync())
            return;

        if (page is PurchaseDocumentListViewModelBase listPage)
        {
            await listPage.ReloadPurchaseDocumentsAsync();
            return;
        }

        var items = await ImsApiClient.GetPurchaseDocumentsAsync(type);
        var stats = await ImsApiClient.GetPurchaseDocumentStatsAsync(type);

        await RunOnUiAsync(() =>
        {
            page.ReplaceAllRows(items.Select(d => ApiDocumentMapper.PurchaseDocumentToMockRow(d, page.Col3Header)));
            if (page is PurchaseDocumentListViewModelBase legacyList && stats is not null)
                legacyList.RefreshStats(stats);
        });
    }

    public static void RefreshSalesOrders(object page)
    {
        if (page is SalesOrdersViewModel salesOrders)
        {
            _ = salesOrders.ReloadSalesOrdersAsync();
            return;
        }

        if (page is MockPageViewModel mockPage)
            ApiUiHelper.RunWithApiFireAndForget(async () => await LoadSalesOrdersAsync(mockPage));
    }

    internal static async Task LoadSalesOrdersAsync(MockPageViewModel page)
    {
        if (!await EnsureApiAvailableAsync())
            return;

        var orders = await ImsApiClient.GetSalesOrdersAsync();
        var stats = await ImsApiClient.GetSalesOrderStatsAsync()
            ?? BuildSalesOrderStatsFromOrders(orders);

        await RunOnUiAsync(() =>
        {
            page.ReplaceAllRows(orders.Select(o => ApiDocumentMapper.SalesOrderToMockRow(o, page.Col3Header)));
        });
    }

    private static SalesOrderStatsDto BuildSalesOrderStatsFromOrders(IReadOnlyList<SalesOrderDto> orders)
    {
        static bool IsStatus(SalesOrderDto o, string status) =>
            string.Equals(o.Status, status, StringComparison.OrdinalIgnoreCase);

        var open = orders.Count(o => IsStatus(o, "open"));
        var confirmed = orders.Count(o => IsStatus(o, "confirmed"));
        var picking = orders.Count(o => IsStatus(o, "picking"));
        var draft = orders.Count(o => IsStatus(o, "draft"));
        var shipped = orders.Count(o => IsStatus(o, "shipped"));
        var closed = orders.Count(o => IsStatus(o, "closed"));
        var cancelled = orders.Count(o => IsStatus(o, "cancelled"));

        return new SalesOrderStatsDto
        {
            Total = orders.Count,
            Open = open,
            Confirmed = confirmed,
            Picking = picking,
            Draft = draft,
            Shipped = shipped,
            Closed = closed,
            Cancelled = cancelled,
            ToShip = confirmed + picking + draft,
            Active = open + confirmed + picking + draft
        };
    }

    private static Task RunOnUiAsync(Action action)
    {
        var dispatcher = Application.Current?.Dispatcher;
        if (dispatcher is null || dispatcher.CheckAccess())
        {
            action();
            return Task.CompletedTask;
        }

        return dispatcher.InvokeAsync(action, DispatcherPriority.Normal).Task;
    }

    public static void RefreshStockTransfers(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetStockTransfersAsync();
            await RunOnUiAsync(() => page.ReplaceAllRows(items.Select(ApiDocumentMapper.StockTransferToMockRow)));
        });

    public static void RefreshProducts(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var products = await ImsApiClient.GetProductsAsync();
            page.ReplaceAllRows(products.Select(ApiDocumentMapper.ProductToMockRow));
            if (page is ProductsViewModel productsPage)
                productsPage.RefreshStats();
        });

    public static void RefreshAccounts(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var accounts = await ImsApiClient.GetAccountsAsync();
            page.ReplaceAllRows(accounts.Select(ApiDocumentMapper.AccountToMockRow));
            if (page is AccountLedgerViewModel accountLedger)
                accountLedger.RefreshStats(accounts);
        });

    public static void RefreshProductTypes(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetProductTypesAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.ProductTypeToMockRow));
            if (page is ProductTypesViewModel productTypes)
                productTypes.RefreshStats();
            ClassificationMasterCatalog.SetProductTypeNames(items.Select(pt => pt.Name));
        });

    public static void RefreshProductMainGroups(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetProductMainGroupsAsync();
            var subGroups = await ImsApiClient.GetProductSubGroupsAsync();
            var products = await ImsApiClient.GetProductsAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.ProductMainGroupToMockRow));
            if (page is ProductMainGroupsViewModel mainGroups)
                mainGroups.RefreshStats(subGroups.Count, products.Count);
            ClassificationMasterCatalog.SetMainGroupNames(items.Select(i => i.Name));
        });

    public static void RefreshAssemblyTypes(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetAssemblyTypesAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.AssemblyTypeToMockRow));
            if (page is AssemblyTypesViewModel assemblyTypes)
                assemblyTypes.RefreshStats();
            ClassificationMasterCatalog.SetAssemblyTypeNames(items.Select(i => i.Name));
        });

    public static void RefreshMachines(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetMachinesAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.MachineToMockRow));
            if (page is MachinesViewModel machines)
                machines.RefreshStats();
        });

    public static void RefreshPayrollEmployees(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;
            var items = await ImsApiClient.GetPayrollEmployeesAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.PayrollEmployeeToMockRow));
            if (page is PayrollEmployeesViewModel vm)
                vm.RefreshStats(items);
        });

    public static void RefreshAttendance(AttendanceViewModel page, string? periodMonth = null) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;
            var month = periodMonth ?? page.PeriodMonth;
            var items = await ImsApiClient.GetAttendanceAsync(periodMonth: month);
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.AttendanceToMockRow));
        });

    public static void RefreshPayrollRuns(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;
            var items = await ImsApiClient.GetPayrollRunsAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.PayrollRunToMockRow));
            if (page is PayrollRunsViewModel vm)
                vm.RefreshStats(items);
        });

    public static void RefreshWarehouses(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetWarehousesAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.WarehouseToMockRow));
            if (page is WarehousesViewModel warehouses)
                warehouses.RefreshStats();
        });

    public static void RefreshBillFormats(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            await ImsApiClient.EnsureSalesBillTemplateDefaultsAsync();
            var catalog = await ImsApiClient.GetBillFormatCatalogAsync();
            var labels = catalog?.TransactionTypes.ToDictionary(t => t.Key, t => t.Label)
                ?? new Dictionary<string, string>();
            var items = await ImsApiClient.GetBillFormatsAsync();
            page.ReplaceAllRows(items.Select(t => ApiDocumentMapper.BillFormatToMockRow(t, labels)));
            if (page is BillFormatsViewModel billFormats)
                billFormats.RefreshStats();
        });

    public static void RefreshReportFormats(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            try
            {
                await ImsApiClient.EnsureReportingDefaultsAsync();
                await ImsApiClient.ApplyStandardReportLayoutsAsync();
            }
            catch
            {
                /* list endpoint also auto-seeds when empty */
            }

            var items = await ImsApiClient.GetReportFormatsAsync();
            page.ReplaceAllRows(items.Select(f => new MockRow
            {
                Col1 = f.FormatCode,
                Col2 = f.FormatName,
                Col3 = f.TransactionType,
                Col4 = f.IsDefault ? "Yes" : "",
                Source = f
            }));
        });

    public static void RefreshCreditNotes(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetCreditNotesAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.CreditNoteToMockRow));
            if (page is CreditNotesViewModel creditNotes)
                creditNotes.RefreshStats(items);
        });

    public static void RefreshDebitNotes(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetDebitNotesAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.DebitNoteToMockRow));
            if (page is DebitNotesViewModel debitNotes)
                debitNotes.RefreshStats(items);
        });

    public static void RefreshProductionOrders(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetProductionOrdersAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.ProductionOrderToMockRow));
            if (page is ProductionOrdersViewModel production)
            {
                var stats = await ImsApiClient.GetProductionOrderStatsAsync();
                production.RefreshStats(stats, items);
            }
        });

    public static void RefreshBoms(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetBomsAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.BomToMockRow));
            if (page is BomViewModel bomPage)
                bomPage.RefreshStats(items);
        });

    public static void RefreshCashEntries(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetCashEntriesAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.CashEntryToMockRow));
            if (page is CashEntriesViewModel cashEntries)
                cashEntries.RefreshStats(items);
        });

    public static void RefreshBankEntries(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetBankEntriesAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.BankEntryToMockRow));
            if (page is BankEntriesViewModel bankEntries)
                bankEntries.RefreshStats(items);
        });

    public static void RefreshReceiptVouchers(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetReceiptVouchersAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.ReceiptVoucherToMockRow));
            if (page is ReceiptVouchersViewModel receiptVouchers)
                receiptVouchers.RefreshStats(items);
        });

    public static void RefreshPaymentVouchers(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetPaymentVouchersAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.PaymentVoucherToMockRow));
            if (page is PaymentVouchersViewModel paymentVouchers)
                paymentVouchers.RefreshStats(items);
        });

    public static void RefreshUsers(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetUsersAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.UserToMockRow));
            if (page is UsersViewModel users)
                users.RefreshStats();
        });

    public static void RefreshCompanies(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetCompaniesAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.CompanyToMockRow));
            if (page is CompanyRegistrationsViewModel companies)
                companies.RefreshStats(items);
            await CompanyProfileService.RefreshAsync();
        });

    public static void RefreshCustomerTypes(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetCustomerTypesAsync();
            var accounts = await ImsApiClient.GetAccountsAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.CustomerTypeToMockRow));
            if (page is CustomerTypesViewModel customerTypes)
                customerTypes.RefreshStats(accounts.Count);
            CustomerTypeCatalog.SetCustomerTypeNames(items.Select(i => i.Name));
        });

    public static void RefreshSaleUoms(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var items = await ImsApiClient.GetSaleUomsAsync();
            var products = await ImsApiClient.GetProductsAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.SaleUomToMockRow));
            if (page is SaleUomsViewModel saleUoms)
                saleUoms.RefreshStats(products.Count);
            ClassificationMasterCatalog.SetSaleUomNames(items.Select(i => i.Name));
        });

    public static void RefreshProductSubGroups(MockPageViewModel page) =>
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            if (!await EnsureApiAvailableAsync())
                return;

            var mainGroups = await ImsApiClient.GetProductMainGroupsAsync();
            var items = await ImsApiClient.GetProductSubGroupsAsync();
            page.ReplaceAllRows(items.Select(ApiDocumentMapper.ProductSubGroupToMockRow));
            ClassificationMasterCatalog.SetMainGroupNames(mainGroups.Select(i => i.Name));
            if (page is ProductSubGroupsViewModel subGroups)
                subGroups.RefreshStats(mainGroups.Count);
            ClassificationMasterCatalog.SetSubGroupNames(items.Select(i => i.Name));
        });

    public static void RefreshDashboard(DashboardViewModel page) =>
        _ = page.EnsureLoadedAsync();
}
