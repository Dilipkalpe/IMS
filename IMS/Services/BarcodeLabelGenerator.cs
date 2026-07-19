using System.Globalization;
using IMS.Models;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

public static class BarcodeLabelGenerator
{
    public static async Task<BarcodeLabelPrintResult> GenerateFromPurchaseInvoiceAsync(
        NumberedPurchaseDocumentDto invoice,
        BarcodeLabelPrintOptions options)
    {
        var warnings = new List<string>();
        var labels = new List<BarcodeLabelItem>();
        var productCache = new Dictionary<string, ProductDto?>(StringComparer.OrdinalIgnoreCase);
        var docNo = invoice.FormattedDocNo ?? $"{invoice.DocPrefix}-{invoice.DocNo}";
        var copyMultiplier = Math.Max(1, options.CopyMultiplier);

        foreach (var line in invoice.Lines ?? [])
        {
            var code = line.ProductRetailCode?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(code))
            {
                warnings.Add($"Skipped a line with no product code ({line.ItemDescription}).");
                continue;
            }

            if (!productCache.ContainsKey(code) && ImsApiClient.IsAvailable)
            {
                try
                {
                    productCache[code] = await ImsApiClient.GetProductByCodeAsync(code);
                }
                catch
                {
                    productCache[code] = null;
                }
            }

            productCache.TryGetValue(code, out var product);
            var barcodeValue = ResolveBarcodeValue(code, product);
            var missingBarcode = string.IsNullOrWhiteSpace(barcodeValue);

            if (missingBarcode)
                warnings.Add($"Product {code} has no scannable barcode — using product code on the label.");

            var labelCount = options.QuantitySource == BarcodeLabelQuantitySource.PurchaseQuantity
                ? ResolvePurchaseLabelCount(line.Qty)
                : Math.Max(1, options.CustomQuantityPerLine);

            labelCount *= copyMultiplier;

            var item = new BarcodeLabelItem
            {
                ProductCode = code,
                ProductName = string.IsNullOrWhiteSpace(line.ItemDescription)
                    ? product?.Name ?? code
                    : line.ItemDescription.Trim(),
                BarcodeValue = missingBarcode ? code : barcodeValue,
                MissingBarcode = missingBarcode,
                BatchNo = null,
                Mrp = FormatMoney(ResolveMrp(line, product)),
                SalesRate = FormatMoney(ResolveSalesRate(line, product)),
                ManufacturingDate = null,
                ExpiryDate = null,
                PurchaseInvoiceNo = docNo
            };

            for (var i = 0; i < labelCount; i++)
                labels.Add(item);
        }

        if (labels.Count == 0)
            warnings.Add("No labels were generated — the purchase invoice has no product lines.");

        return new BarcodeLabelPrintResult
        {
            Labels = labels,
            Warnings = warnings
        };
    }

    private static int ResolvePurchaseLabelCount(string? qtyText)
    {
        if (!decimal.TryParse(qtyText?.Replace(",", string.Empty), NumberStyles.Any, CultureInfo.InvariantCulture, out var qty)
            || qty <= 0)
            return 1;

        return Math.Max(1, (int)Math.Ceiling(qty));
    }

    private static string ResolveBarcodeValue(string code, ProductDto? product)
    {
        if (string.IsNullOrWhiteSpace(code))
            return string.Empty;

        return code.Trim().ToUpperInvariant();
    }

    private static decimal ResolveMrp(SalesOrderLineDto line, ProductDto? product)
    {
        if (product is not null && product.SalePrice > 0)
            return product.SalePrice;

        return ParseDecimal(line.Rate);
    }

    private static decimal ResolveSalesRate(SalesOrderLineDto line, ProductDto? product)
    {
        var fromLine = ParseDecimal(line.SalesRate);
        if (fromLine > 0)
            return fromLine;

        if (product is not null && product.SalePrice > 0)
            return product.SalePrice;

        return 0;
    }

    private static decimal ParseDecimal(string? value) =>
        decimal.TryParse(value?.Replace(",", string.Empty), NumberStyles.Any, CultureInfo.InvariantCulture, out var d)
            ? d
            : 0;

    private static string? FormatMoney(decimal value) =>
        value > 0 ? value.ToString("N2", CultureInfo.InvariantCulture) : null;
}
