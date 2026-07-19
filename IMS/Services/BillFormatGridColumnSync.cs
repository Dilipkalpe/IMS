using IMS.Models;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

/// <summary>
/// Syncs bill format item-detail columns with <c>gridcolumnglobaldefaults</c> (moduleKey = transaction type).
/// Maps entry-grid keys (Settings → Manage columns) to bill-print keys (Bill Format catalog).
/// </summary>
public static class BillFormatGridColumnSync
{
    private static readonly Dictionary<string, string> GridKeyToPrintKey = new(StringComparer.OrdinalIgnoreCase)
    {
        ["sr"] = "srNo",
        ["code"] = "itemCode",
        ["itemDescription"] = "description",
        ["itemName"] = "itemName",
        ["qty"] = "qty",
        ["rate"] = "rate",
        ["salesRate"] = "rate",
        ["discPercent"] = "discount",
        ["lineTotal"] = "amount",
        ["cgstPercent"] = "gstPercent",
        ["sgstPercent"] = "gstPercent",
        ["igstPercent"] = "gstPercent",
        ["cgstAmount"] = "taxAmount",
        ["sgstAmount"] = "taxAmount",
        ["igstAmount"] = "taxAmount",
        ["taxableValue"] = "amount",
        ["hsnCode"] = "hsnCode",
        ["orderedQty"] = "orderedQty",
        ["receivedQty"] = "receivedQty",
        ["acceptedQty"] = "acceptedQty",
        ["rejectedQty"] = "rejectedQty",
        ["pendingQty"] = "pendingQty",
        ["unit"] = "unit"
    };

    public static string ToPrintColumnKey(string gridOrPrintKey)
    {
        if (string.IsNullOrWhiteSpace(gridOrPrintKey))
            return string.Empty;

        var key = gridOrPrintKey.Trim();
        return GridKeyToPrintKey.TryGetValue(key, out var mapped) ? mapped : key;
    }

    public static bool IsSupportedModuleKey(string? transactionType) =>
        !string.IsNullOrWhiteSpace(transactionType)
        && SalesGridColumnCatalog.AllModuleKeys.Any(k =>
            string.Equals(k, transactionType.Trim(), StringComparison.OrdinalIgnoreCase));

    /// <summary>Visible column keys from <c>gridcolumnglobaldefaults</c> for the transaction type.</summary>
    public static async Task<IReadOnlyList<string>?> LoadGlobalGridColumnKeysAsync(string transactionType)
    {
        var moduleKey = transactionType.Trim();
        if (!IsSupportedModuleKey(moduleKey) || !ImsApiClient.IsAvailable)
            return null;

        try
        {
            var prefs = await ImsApiClient.GetGridColumnPreferencesAsync(moduleKey).ConfigureAwait(false);
            if (prefs is null)
                return null;

            if (prefs.HasGlobalDefault && prefs.GlobalVisibleColumnKeys.Count > 0)
                return prefs.GlobalVisibleColumnKeys;

            return null;
        }
        catch
        {
            return null;
        }
    }

    public static async Task ApplyOrganizationColumnsToLayoutAsync(
        SalesBillLayoutDefinition layout,
        BillFormatCatalogDto? catalog,
        string transactionType)
    {
        var moduleKey = transactionType.Trim();
        var gridKeys = await LoadGlobalGridColumnKeysAsync(moduleKey).ConfigureAwait(false);
        if (gridKeys is null || gridKeys.Count == 0)
        {
            BillFormatLayoutBootstrap.ApplyDefaultColumns(layout, catalog, moduleKey);
            return;
        }

        layout.ItemTable.Columns = BuildColumnsFromGlobalGridKeys(gridKeys, catalog, moduleKey);
        layout.ItemTable.Visible = true;
        layout.ItemTable.ShowHeader = true;
    }

    public static async Task ApplyOrganizationColumnVisibilityForPrintAsync(
        SalesBillLayoutDefinition layout,
        string transactionType)
    {
        var gridKeys = await LoadGlobalGridColumnKeysAsync(transactionType).ConfigureAwait(false);
        if (gridKeys is null || gridKeys.Count == 0)
            return;

        var visiblePrintKeys = gridKeys
            .Select(ToPrintColumnKey)
            .Where(k => !string.IsNullOrWhiteSpace(k))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (layout.ItemTable.Columns.Count == 0)
        {
            layout.ItemTable.Columns = BuildColumnsFromGlobalGridKeys(gridKeys, catalog: null, transactionType);
            return;
        }

        foreach (var col in layout.ItemTable.Columns)
            col.Visible = visiblePrintKeys.Contains(col.Key);

        var ordered = new List<SalesBillItemColumnDefinition>();
        var existing = layout.ItemTable.Columns.ToDictionary(c => c.Key, StringComparer.OrdinalIgnoreCase);

        foreach (var printKey in visiblePrintKeys)
        {
            if (existing.TryGetValue(printKey, out var col))
                ordered.Add(col);
        }

        foreach (var col in layout.ItemTable.Columns)
        {
            if (!ordered.Any(c => string.Equals(c.Key, col.Key, StringComparison.OrdinalIgnoreCase)))
                ordered.Add(col);
        }

        layout.ItemTable.Columns = ordered;
    }

    private static List<SalesBillItemColumnDefinition> BuildColumnsFromGlobalGridKeys(
        IReadOnlyList<string> gridKeys,
        BillFormatCatalogDto? catalog,
        string moduleKey)
    {
        var columns = new List<SalesBillItemColumnDefinition>();
        var seenPrintKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var gridCatalog = SalesGridColumnCatalog.GetColumnsForModule(moduleKey);

        foreach (var gridKey in gridKeys)
        {
            if (string.Equals(gridKey, "actions", StringComparison.OrdinalIgnoreCase))
                continue;

            var printKey = ToPrintColumnKey(gridKey);
            if (string.IsNullOrWhiteSpace(printKey) || !seenPrintKeys.Add(printKey))
                continue;

            var billCol = catalog?.ItemColumns.FirstOrDefault(c =>
                string.Equals(c.Key, printKey, StringComparison.OrdinalIgnoreCase));
            var gridCol = gridCatalog.FirstOrDefault(c =>
                string.Equals(c.Key, gridKey, StringComparison.OrdinalIgnoreCase));

            columns.Add(new SalesBillItemColumnDefinition
            {
                Key = printKey,
                Header = billCol?.Header ?? gridCol?.Header ?? BillFormatLayoutBootstrap.FormatColumnHeader(printKey),
                Visible = true,
                Width = billCol?.Width ?? DefaultWidth(printKey),
                Align = billCol?.Align ?? AlignForKey(printKey)
            });
        }

        return columns;
    }

    private static double DefaultWidth(string printKey) => printKey switch
    {
        "srNo" => 36,
        "description" => 140,
        "amount" => 64,
        _ => 56
    };

    private static string AlignForKey(string printKey) =>
        printKey is "qty" or "rate" or "amount" or "orderedQty" or "receivedQty" or "acceptedQty"
            or "rejectedQty" or "pendingQty" or "discount" or "gstPercent" or "taxAmount"
            ? "right"
            : printKey is "srNo"
                ? "center"
                : "left";
}
