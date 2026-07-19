using System.Windows;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels;
using IMS.Views;

namespace IMS.Services;

public static class DocumentConsolidationPickService
{
    public static async Task<IReadOnlyList<NumberedDocReferenceDto>?> PickDeliveryChallansForInvoiceAsync(
        string customer,
        Window? owner = null)
    {
        return await PickAsync(
            customer,
            owner,
            "Delivery Challans",
            "Customer",
            "Select one or more delivery challans with pending invoice quantity.",
            "DC No",
            async c => await ImsApiClient.GetPendingDeliveryChallansForInvoiceAsync(c),
            o => o.Customer,
            o => o.DcDate,
            $"No uninvoiced delivery challans found for customer \"{customer}\".");
    }

    public static async Task<IReadOnlyList<SalesOrderLineDto>?> LoadInvoiceLinesFromDeliveryChallansAsync(
        string customer,
        IReadOnlyList<NumberedDocReferenceDto> challans)
    {
        PendingConsolidationLinesResponseDto? response = null;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            response = await ImsApiClient.GetPendingInvoiceLinesFromDeliveryChallansAsync(
                new PendingConsolidationLinesRequestDto
                {
                    Customer = customer,
                    DeliveryChallans = challans.ToList()
                });
        }, "Load Lines");

        return response?.Lines;
    }

    public static async Task<IReadOnlyList<NumberedDocReferenceDto>?> PickPurchaseOrdersForReceiptAsync(
        string supplier,
        Window? owner = null)
    {
        return await PickAsync(
            supplier,
            owner,
            "Purchase Orders",
            "Supplier",
            "Select one or more open or partially received purchase orders.",
            "PO No",
            async s => await ImsApiClient.GetPendingPurchaseOrdersForReceiptAsync(s),
            o => o.Supplier,
            o => o.PoDate,
            $"No open purchase orders with pending receipt quantity found for supplier \"{supplier}\".");
    }

    public static async Task<IReadOnlyList<SalesOrderLineDto>?> LoadReceiptLinesFromPurchaseOrdersAsync(
        string supplier,
        IReadOnlyList<NumberedDocReferenceDto> orders)
    {
        PendingConsolidationLinesResponseDto? response = null;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            response = await ImsApiClient.GetPendingReceiptLinesFromPurchaseOrdersAsync(
                new PendingConsolidationLinesRequestDto
                {
                    Supplier = supplier,
                    PurchaseOrders = orders.ToList()
                });
        }, "Load Lines");

        return response?.Lines;
    }

    public static async Task<IReadOnlyList<NumberedDocReferenceDto>?> PickGrnsForPurchaseInvoiceAsync(
        string supplier,
        Window? owner = null)
    {
        return await PickAsync(
            supplier,
            owner,
            "GRNs",
            "Supplier",
            "Select one or more GRNs with pending purchase invoice quantity.",
            "GRN No",
            async s => await ImsApiClient.GetPendingGrnsForInvoiceAsync(s),
            o => o.Supplier,
            o => o.GrnDate,
            $"No uninvoiced GRNs found for supplier \"{supplier}\".");
    }

    public static async Task<IReadOnlyList<SalesOrderLineDto>?> LoadPurchaseInvoiceLinesFromGrnsAsync(
        string supplier,
        IReadOnlyList<NumberedDocReferenceDto> grns)
    {
        PendingConsolidationLinesResponseDto? response = null;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            response = await ImsApiClient.GetPendingPurchaseInvoiceLinesFromGrnsAsync(
                new PendingConsolidationLinesRequestDto
                {
                    Supplier = supplier,
                    Grns = grns.ToList()
                });
        }, "Load Lines");

        return response?.Lines;
    }

    private static async Task<IReadOnlyList<NumberedDocReferenceDto>?> PickAsync(
        string party,
        Window? owner,
        string dialogTitle,
        string partyLabel,
        string instructions,
        string docNoColumnHeader,
        Func<string, Task<PendingNumberedDocsResponseDto?>> fetchPending,
        Func<PendingNumberedDocHeaderDto, string?> partySelector,
        Func<PendingNumberedDocHeaderDto, DateTime?> dateSelector,
        string emptyMessage)
    {
        if (string.IsNullOrWhiteSpace(party))
            return null;

        if (!await ImsApiClient.CheckHealthAsync())
        {
            MessageBox.Show(
                owner ?? Application.Current?.MainWindow,
                "API is not available to load documents.",
                dialogTitle,
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return null;
        }

        PendingNumberedDocsResponseDto? pending = null;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            pending = await fetchPending(party.Trim());
        }, dialogTitle);

        if (pending is null)
            return null;

        if (pending.Items.Count == 0)
        {
            MessageBox.Show(
                owner ?? WindowHelper.GetOwnerWindow() ?? Application.Current?.MainWindow,
                emptyMessage,
                dialogTitle,
                MessageBoxButton.OK,
                MessageBoxImage.Information);
            return null;
        }

        var vm = new NumberedDocMultiPickViewModel(
            partyLabel,
            party.Trim(),
            instructions,
            docNoColumnHeader,
            pending.Items,
            partySelector,
            dateSelector);

        var ownerWindow = owner ?? WindowHelper.GetOwnerWindow() ?? Application.Current?.MainWindow;
        var window = new NumberedDocMultiPickWindow(vm, $"Select {dialogTitle}")
        {
            Owner = ownerWindow,
            ShowInTaskbar = true
        };

        if (ownerWindow is null)
            window.WindowStartupLocation = WindowStartupLocation.CenterScreen;

        return window.ShowDialog() == true ? vm.Result : null;
    }
}
