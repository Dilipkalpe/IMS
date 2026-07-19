using IMS.Models;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

public static class BillFormatTemplateService
{
    private static readonly Dictionary<string, (SalesBillTemplateDto Dto, DateTime LoadedUtc)> Cache = new();
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(2);

    public static void InvalidateCache()
    {
        Cache.Clear();
        BillFormatPrintResolver.InvalidateAccountMap();
    }

    public static async Task<BillFormatCatalogDto?> GetCatalogAsync()
    {
        if (!ImsApiClient.IsAvailable)
            return null;
        try
        {
            return await ImsApiClient.GetBillFormatCatalogAsync();
        }
        catch
        {
            return null;
        }
    }

    public static async Task<SalesBillTemplateDto?> ResolveTemplateAsync(
        string docTypeKey,
        string? partyCode = null,
        string? accountType = null)
    {
        var key = $"{docTypeKey}|{partyCode ?? ""}|{accountType ?? ""}".ToLowerInvariant();
        if (Cache.TryGetValue(key, out var cached) && DateTime.UtcNow - cached.LoadedUtc < CacheTtl)
            return cached.Dto;

        if (!ImsApiClient.IsAvailable)
            return await SalesBillTemplateService.GetDefaultTemplateAsync(docTypeKey);

        try
        {
            var result = await ImsApiClient.ResolveBillFormatAsync(docTypeKey, partyCode, accountType);
            var dto = result?.Template ?? await ImsApiClient.GetDefaultSalesBillTemplateAsync(docTypeKey);
            if (dto is not null)
                Cache[key] = (dto, DateTime.UtcNow);
            return dto;
        }
        catch
        {
            return await SalesBillTemplateService.GetDefaultTemplateAsync(docTypeKey);
        }
    }

    public static async Task<SalesBillLayoutDefinition?> ResolveLayoutAsync(
        string docTypeKey,
        string? partyCode = null,
        string? accountType = null)
    {
        var template = await ResolveTemplateAsync(docTypeKey, partyCode, accountType);
        return BillFormatLayoutMerger.ToPrintLayout(template);
    }

    public static SalesBillLayoutDefinition? ToPrintLayout(SalesBillTemplateDto? template) =>
        BillFormatLayoutMerger.ToPrintLayout(template);

    public static string DocTypeKeyFromSalesEntry(SalesEntryType type) =>
        SalesBillTemplateService.DocTypeKeyFromSalesEntry(type);

    public static string DocTypeKeyFromPurchaseDoc(string docType) =>
        docType.Trim().ToLowerInvariant() switch
        {
            "po" or "purchase_order" => "purchase_order",
            "pi" or "purchase_invoice" => "purchase_invoice",
            "pr" or "purchase_return" => "purchase_return",
            "grn" => "grn",
            _ => "purchase_invoice"
        };
}
