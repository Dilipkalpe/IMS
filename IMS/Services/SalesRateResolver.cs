using IMS.Models;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

public sealed record SalesRateResolution(
    decimal Rate,
    string? WarningMessage,
    bool UsedFallback);

public static class SalesRateResolver
{
    public static async Task<SalesRateResolution> ResolveForSalesInvoiceAsync(
        string productCode,
        SalesProductInfo? productHint = null)
    {
        var source = SalesPurchaseSettingsService.Instance.Current.SalesRateSource;
        var masterRate = await ResolveProductMasterRateAsync(productCode, productHint);
        var purchaseRate = await ResolvePurchaseInvoiceRateAsync(productCode);

        if (source == SalesRateSource.ProductMaster)
            return PickWithFallback(masterRate, purchaseRate, productCode, primaryLabel: "product master", fallbackLabel: "purchase invoice");

        return PickWithFallback(purchaseRate, masterRate, productCode, primaryLabel: "purchase invoice", fallbackLabel: "product master");
    }

    private static SalesRateResolution PickWithFallback(
        decimal primary,
        decimal fallback,
        string productCode,
        string primaryLabel,
        string fallbackLabel)
    {
        if (primary > 0)
            return new SalesRateResolution(primary, null, false);

        if (fallback > 0)
            return new SalesRateResolution(
                fallback,
                $"No sales rate in {primaryLabel} for {productCode}. Using {fallbackLabel} rate instead.",
                true);

        return new SalesRateResolution(
            0,
            $"No sales rate found for {productCode} in product master or purchase invoices. Enter the rate manually.",
            false);
    }

    private static async Task<decimal> ResolveProductMasterRateAsync(string productCode, SalesProductInfo? productHint)
    {
        if (productHint is not null)
        {
            if (productHint.SaleRate > 0)
                return productHint.SaleRate;
            if (productHint.Rate > 0)
                return productHint.Rate;
        }

        if (ImsApiClient.IsAvailable)
        {
            try
            {
                var dto = await ImsApiClient.GetProductByCodeAsync(productCode);
                if (dto is not null && dto.SalePrice > 0)
                    return dto.SalePrice;
            }
            catch
            {
                // fall through
            }
        }

        var local = SalesProductLookup.FindLocal(productCode);
        if (local is not null)
            return local.SaleRate > 0 ? local.SaleRate : local.Rate;

        return 0;
    }

    private static async Task<decimal> ResolvePurchaseInvoiceRateAsync(string productCode)
    {
        if (!ImsApiClient.IsAvailable)
            return 0;

        try
        {
            var dto = await ImsApiClient.GetLatestPurchaseInvoiceSalesRateAsync(productCode);
            if (dto?.SalesRate is null)
                return 0;

            return decimal.TryParse(dto.SalesRate.Replace(",", string.Empty), out var rate) && rate > 0
                ? rate
                : 0;
        }
        catch
        {
            return 0;
        }
    }
}
