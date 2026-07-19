using IMS.Models;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

/// <summary>Default sections and item columns for new or incomplete bill format layouts.</summary>
public static class BillFormatLayoutBootstrap
{
    public static SalesBillLayoutDefinition CreateForTransaction(
        BillFormatCatalogDto? catalog,
        string transactionType,
        string documentTitle)
    {
        var layout = new SalesBillLayoutDefinition
        {
            Version = catalog?.LayoutVersion > 0 ? catalog.LayoutVersion : 2,
            DocumentTitle = documentTitle,
            Visibility = catalog?.DefaultVisibility ?? new BillFormatVisibilityRules(),
            PrintSettings = catalog?.DefaultPrintSettings ?? new BillFormatPrintSettings(),
            Page = new SalesBillPageSettings(),
            Theme = new SalesBillThemeSettings()
        };

        layout.Sections =
        [
            Section("header", "Document title", "{{documentTitle}}", y: 2, height: 8),
            Section("companyDetails", "Company details", y: 12, height: 14),
            IsPurchase(transactionType)
                ? Section("supplierDetails", "Supplier details", y: 28, height: 12)
                : Section("customerDetails", "Customer details", y: 28, height: 12),
            Section("itemTable", "Item details", y: 42, height: 28, width: 94),
            Section("taxDetails", "Tax & totals", y: 72, height: 14),
            Section("footer", "Footer", y: 88, height: 6)
        ];

        layout.ItemTable.Visible = true;
        layout.ItemTable.ShowHeader = true;
        ApplyDefaultColumns(layout, catalog, transactionType);
        return layout;
    }

    public static void ApplyDefaultColumns(
        SalesBillLayoutDefinition layout,
        BillFormatCatalogDto? catalog,
        string transactionType)
    {
        if (layout.ItemTable.Columns.Count > 0)
            return;

        layout.ItemTable.Columns = BuildColumnDefinitions(catalog, transactionType);
    }

    public static List<SalesBillItemColumnDefinition> BuildColumnDefinitions(
        BillFormatCatalogDto? catalog,
        string transactionType)
    {
        var keys = ResolveColumnKeys(catalog, transactionType);
        var columns = new List<SalesBillItemColumnDefinition>();
        foreach (var key in keys)
        {
            var info = catalog?.ItemColumns.FirstOrDefault(c =>
                string.Equals(c.Key, key, StringComparison.OrdinalIgnoreCase));
            columns.Add(new SalesBillItemColumnDefinition
            {
                Key = key,
                Header = info?.Header ?? FormatColumnHeader(key),
                Visible = true,
                Width = info?.Width ?? 60,
                Align = info?.Align ?? "left"
            });
        }

        return columns;
    }

    public static void EnsureItemTableSection(SalesBillLayoutDefinition layout, string transactionType)
    {
        if (layout.Sections.Any(s => string.Equals(s.Type, "itemTable", StringComparison.OrdinalIgnoreCase)))
            return;

        var order = layout.Sections.Count;
        layout.Sections.Add(new SalesBillSectionDefinition
        {
            Id = $"itemTable_{Guid.NewGuid():N}"[..24],
            Type = "itemTable",
            Label = "Item details",
            Visible = true,
            Order = order,
            X = 3,
            Y = 42,
            Width = 94,
            Height = 28
        });
        layout.ItemTable.Visible = true;
    }

    private static IReadOnlyList<string> ResolveColumnKeys(BillFormatCatalogDto? catalog, string transactionType)
    {
        if (catalog?.DefaultColumnsByTransaction is not null
            && catalog.DefaultColumnsByTransaction.TryGetValue(transactionType, out var keys)
            && keys.Count > 0)
            return keys;

        return transactionType switch
        {
            "grn" => ["srNo", "itemCode", "description", "orderedQty", "receivedQty", "acceptedQty", "rejectedQty", "unit"],
            "purchase_order" => ["srNo", "itemCode", "description", "qty", "unit", "rate", "amount"],
            "purchase_invoice" => ["srNo", "itemCode", "description", "qty", "rate", "gstPercent", "amount"],
            "purchase_return" => ["srNo", "itemCode", "description", "qty", "rate", "amount"],
            "sales_order" => ["srNo", "itemCode", "description", "qty", "rate", "amount"],
            "delivery_challan" => ["srNo", "itemCode", "description", "qty", "unit"],
            _ => ["srNo", "itemCode", "description", "qty", "rate", "amount"]
        };
    }

    private static bool IsPurchase(string transactionType) =>
        transactionType.StartsWith("purchase", StringComparison.OrdinalIgnoreCase)
        || string.Equals(transactionType, "grn", StringComparison.OrdinalIgnoreCase);

    private static SalesBillSectionDefinition Section(
        string type,
        string label,
        string? text = null,
        double x = 3,
        double y = 5,
        double width = 94,
        double height = 10) =>
        new()
        {
            Id = $"{type}_{Guid.NewGuid():N}"[..24],
            Type = type,
            Label = label,
            Text = text,
            Visible = true,
            X = x,
            Y = y,
            Width = width,
            Height = height
        };

    public static string FormatColumnHeader(string key) => key switch
    {
        "srNo" => "Sr No",
        "itemCode" => "Item Code",
        "itemName" => "Item Name",
        "hsnCode" => "HSN Code",
        "orderedQty" => "Ordered Qty",
        "receivedQty" => "Received Qty",
        "acceptedQty" => "Accepted Qty",
        "rejectedQty" => "Rejected Qty",
        "pendingQty" => "Pending Qty",
        "gstPercent" => "Tax %",
        _ => key
    };
}
