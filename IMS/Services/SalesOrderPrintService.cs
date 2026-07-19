using IMS.Models;
using IMS.Reporting.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.Services;

public static class SalesOrderPrintService
{
    public static Task<bool> PrintAsync(SalesEntryFormViewModelBase order, bool showDialog = true) =>
        PrintTaxInvoiceAsync(ApiDocumentMapper.ToSalesOrderDtoForPrint(order), showDialog, order.EntryType);

    public static async Task<bool> PrintTaxInvoiceAsync(
        SalesOrderDto dto,
        bool showDialog = true,
        SalesEntryType? entryType = null)
    {
        if (await ReportPrintBridge.TryPrintAsync(dto, showDialog, entryType).ConfigureAwait(false))
            return true;

        var layout = await ResolveBillFormatLayoutAsync(dto, entryType).ConfigureAwait(false);
        if (layout is not null)
        {
            var docKey = ResolveDocKey(entryType);
            await BillFormatGridColumnSync.ApplyOrganizationColumnVisibilityForPrintAsync(layout, docKey)
                .ConfigureAwait(false);
            return SalesBillFlowDocumentRenderer.Print(dto, layout, showDialog, entryType);
        }

        return SalesOrderTaxInvoicePrintService.Print(dto, showDialog, entryType);
    }

    public static async void ShowPreview(SalesOrderDto order, SalesEntryType? entryType = null)
    {
        if (await ReportPrintBridge.TryShowPreviewAsync(order, entryType).ConfigureAwait(true))
            return;

        await CompanyProfileService.RefreshAsync().ConfigureAwait(true);
        var layout = await ResolveBillFormatLayoutAsync(order, entryType).ConfigureAwait(true);
        if (layout is not null)
            SalesBillFlowDocumentRenderer.ShowPreview(order, layout, entryType);
        else
            SalesOrderTaxInvoicePrintService.ShowPreview(order, entryType);
    }

    public static void ShowPreview(NumberedSalesDocumentDto document) =>
        ShowPreview(ApiDocumentMapper.NumberedSalesDocumentToSalesOrderDto(document));

    public static async Task ShowSalesOrderPreviewAsync(AddSalesOrderViewModel form)
    {
        await CompanyProfileService.RefreshAsync().ConfigureAwait(true);
        ShowPreview(ApiDocumentMapper.FromSalesOrderForm(form, form.SavedOrderId), SalesEntryType.SalesOrder);
    }

    private static async Task<SalesBillLayoutDefinition?> ResolveBillFormatLayoutAsync(
        SalesOrderDto dto,
        SalesEntryType? entryType)
    {
        var docKey = ResolveDocKey(entryType);
        return await BillFormatPrintResolver.ResolveLayoutForPrintAsync(docKey, dto, "customer")
            .ConfigureAwait(false);
    }

    /// <summary>After saving a sales document, print preview or auto-print per format settings.</summary>
    public static async Task RunAfterSavePrintActionsAsync(SalesOrderDto dto, SalesEntryType entryType)
    {
        if (!ImsApiClient.IsAvailable)
            return;

        await CompanyProfileService.RefreshAsync().ConfigureAwait(true);
        var docKey = ResolveDocKey(entryType);

        var v2 = await ReportPrintResolver.ResolveForPrintAsync(docKey, dto, "customer").ConfigureAwait(true);
        if (v2 is not null)
        {
            if (v2.PrintSettings.PrintPreview)
            {
                await ReportPrintBridge.TryShowPreviewAsync(dto, entryType).ConfigureAwait(true);
                return;
            }

            if (v2.PrintSettings.AutoPrintAfterSave)
                await PrintTaxInvoiceAsync(dto, showDialog: false, entryType).ConfigureAwait(true);
            return;
        }

        var layout = await ResolveBillFormatLayoutAsync(dto, entryType).ConfigureAwait(true);
        if (layout is null)
            return;

        if (layout.PrintSettings.PrintPreview)
        {
            await UiThread.RunAsync(() => SalesBillFlowDocumentRenderer.ShowPreview(dto, layout, entryType));
            return;
        }

        if (layout.PrintSettings.AutoPrintAfterSave)
            await PrintTaxInvoiceAsync(dto, showDialog: false, entryType).ConfigureAwait(true);
    }

    private static string ResolveDocKey(SalesEntryType? entryType) =>
        entryType is not null
            ? BillFormatTemplateService.DocTypeKeyFromSalesEntry(entryType.Value)
            : "sales_invoice";
}
