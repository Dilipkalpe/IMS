using IMS.Models;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

public static class SalesBillTemplateService
{
    private static readonly Dictionary<string, (SalesBillTemplateDto Dto, DateTime LoadedUtc)> Cache = new();
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(2);

    public static void InvalidateCache()
    {
        Cache.Clear();
        BillFormatPrintResolver.InvalidateAccountMap();
    }

    public static async Task<SalesBillTemplateDto?> GetDefaultTemplateAsync(string docTypeKey = "sales_invoice")
    {
        var key = docTypeKey.Trim().ToLowerInvariant();
        if (Cache.TryGetValue(key, out var cached) && DateTime.UtcNow - cached.LoadedUtc < CacheTtl)
            return cached.Dto;

        if (!ImsApiClient.IsAvailable)
            return null;

        try
        {
            var dto = await ImsApiClient.GetDefaultSalesBillTemplateAsync(key);
            if (dto is not null)
                Cache[key] = (dto, DateTime.UtcNow);
            return dto;
        }
        catch
        {
            return null;
        }
    }

    public static async Task<SalesBillLayoutDefinition?> GetDefaultLayoutAsync(string docTypeKey = "sales_invoice")
    {
        var template = await GetDefaultTemplateAsync(docTypeKey);
        return BillFormatLayoutMerger.ToPrintLayout(template);
    }

    public static SalesBillLayoutDefinition? ParseLayout(SalesBillTemplateDto? template) =>
        template?.ParseLayout();

    public static string DocTypeKeyFromSalesEntry(SalesEntryType type) => type switch
    {
        SalesEntryType.SalesOrder => "sales_order",
        SalesEntryType.DeliveryChallan => "delivery_challan",
        SalesEntryType.SalesInvoice => "sales_invoice",
        SalesEntryType.SalesReturn => "sales_return",
        _ => "sales_invoice"
    };
}
