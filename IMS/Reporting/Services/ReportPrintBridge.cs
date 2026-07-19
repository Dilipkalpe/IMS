using IMS.Models;
using IMS.Reporting.Print;
using IMS.Services;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.Reporting.Services;

/// <summary>Unified print/preview: canvas v2 from MongoDB first, then legacy Bill Format Master.</summary>
public static class ReportPrintBridge
{
    public static async Task<bool> TryShowPreviewAsync(
        SalesOrderDto dto,
        SalesEntryType? entryType,
        string accountType = "customer",
        string? partyLabel = null)
    {
        await CompanyProfileService.RefreshAsync().ConfigureAwait(true);
        var docKey = ResolveDocKey(entryType);
        var label = partyLabel ?? (string.Equals(accountType, "supplier", StringComparison.OrdinalIgnoreCase)
            ? "Supplier"
            : "Customer");

        var v2 = await ReportPrintResolver.ResolveForPrintAsync(docKey, dto, accountType).ConfigureAwait(true);
        if (v2 is not null)
        {
            await ReportGridColumnSync.ApplyOrganizationColumnVisibilityAsync(v2.Layout, docKey)
                .ConfigureAwait(true);
            await ReportPrintEngine.ShowPreviewAsync(dto, v2, entryType, label).ConfigureAwait(true);
            return true;
        }

        return false;
    }

    public static async Task<bool> TryPrintAsync(
        SalesOrderDto dto,
        bool showDialog,
        SalesEntryType? entryType,
        string accountType = "customer",
        string? partyLabel = null)
    {
        await CompanyProfileService.RefreshAsync().ConfigureAwait(true);
        var docKey = ResolveDocKey(entryType);
        var label = partyLabel ?? (string.Equals(accountType, "supplier", StringComparison.OrdinalIgnoreCase)
            ? "Supplier"
            : "Customer");

        var v2 = await ReportPrintResolver.ResolveForPrintAsync(docKey, dto, accountType).ConfigureAwait(false);
        if (v2 is not null)
        {
            await ReportGridColumnSync.ApplyOrganizationColumnVisibilityAsync(v2.Layout, docKey)
                .ConfigureAwait(false);
            return ReportPrintEngine.Print(dto, v2, showDialog, entryType, label);
        }

        return false;
    }

    private static string ResolveDocKey(SalesEntryType? entryType) =>
        entryType is not null
            ? BillFormatTemplateService.DocTypeKeyFromSalesEntry(entryType.Value)
            : "sales_invoice";
}
