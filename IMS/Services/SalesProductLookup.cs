using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

public sealed record SalesProductInfo(
    string Code,
    string Name,
    decimal Rate,
    string TaxType = "GST",
    string TaxPercent = "18",
    decimal SaleRate = 0,
    decimal StockQty = 0);

public static class SalesProductLookup
{
    private static readonly SalesProductInfo[] FallbackCatalog =
    [
        new("10001", "Sample Product A", 150.00m),
        new("10002", "Sample Product B", 320.00m),
        new("10003", "Industrial Pump FG-5001", 2450.00m),
        new("RM-1001", "Steel Sheet 2mm", 85.00m),
        new("PEN", "Ball Pen Blue", 12.50m)
    ];

    public static SalesProductInfo? FindLocal(string? barcodeOrName)
    {
        if (string.IsNullOrWhiteSpace(barcodeOrName))
            return null;

        var term = barcodeOrName.Trim();
        var exact = FallbackCatalog.FirstOrDefault(p =>
            string.Equals(p.Code, term, StringComparison.OrdinalIgnoreCase));
        if (exact is not null)
            return exact;

        return FallbackCatalog.FirstOrDefault(p =>
            p.Name.Contains(term, StringComparison.OrdinalIgnoreCase));
    }

    public static async Task<SalesProductInfo?> FindAsync(string? barcodeOrName)
    {
        if (string.IsNullOrWhiteSpace(barcodeOrName))
            return null;

        if (ImsApiClient.IsAvailable)
        {
            try
            {
                var dto = await ImsApiClient.LookupProductAsync(barcodeOrName);
                if (dto is not null)
                    return FromLookupDto(dto);
            }
            catch
            {
                // fall through to local catalog
            }
        }

        return FindLocal(barcodeOrName);
    }

    public static SalesProductInfo FromLookupDto(ProductLookupDto dto) =>
        new(dto.Code, dto.Name, dto.Rate, dto.TaxType, dto.TaxPercent, 0, dto.StockQty);

    public static SalesProductInfo FromDto(ProductDto dto)
    {
        var taxPercent = dto.Igst > 0 ? dto.Igst : dto.Cgst + dto.Sgst;
        if (taxPercent <= 0)
            taxPercent = 18;

        return new SalesProductInfo(
            dto.Code,
            dto.Name,
            dto.SalePrice,
            "GST",
            taxPercent.ToString(System.Globalization.CultureInfo.InvariantCulture),
            dto.SalePrice,
            dto.StockQty);
    }

    public static SalesProductInfo FromDtoForPurchase(ProductDto dto)
    {
        var taxPercent = dto.Igst > 0 ? dto.Igst : dto.Cgst + dto.Sgst;
        if (taxPercent <= 0)
            taxPercent = 18;

        var rate = dto.PurchasePrice > 0 ? dto.PurchasePrice : dto.SalePrice;
        return new SalesProductInfo(
            dto.Code,
            dto.Name,
            rate,
            "GST",
            taxPercent.ToString(System.Globalization.CultureInfo.InvariantCulture),
            dto.SalePrice,
            dto.StockQty);
    }

    public static Dictionary<string, SalesProductInfo> BuildPurchaseCatalog(IEnumerable<ProductDto> products) =>
        products.ToDictionary(
            p => p.Code,
            FromDtoForPurchase,
            StringComparer.OrdinalIgnoreCase);

    public static IEnumerable<SalesProductInfo> SearchFallback(string term, int limit = 40) =>
        FallbackCatalog
            .Where(p => p.Code.Contains(term, StringComparison.OrdinalIgnoreCase)
                        || p.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
            .Take(limit);

    public static IEnumerable<string> FallbackCatalogForDisplay() =>
        FallbackCatalog.Select(p => $"{p.Code} — {p.Name}");

    public static Dictionary<string, SalesProductInfo> BuildFallbackCatalog() =>
        FallbackCatalog.ToDictionary(p => p.Code, p => p, StringComparer.OrdinalIgnoreCase);

    public static Dictionary<string, SalesProductInfo> BuildCatalog(IEnumerable<ProductDto> products) =>
        products.ToDictionary(
            p => p.Code,
            FromDto,
            StringComparer.OrdinalIgnoreCase);
}
