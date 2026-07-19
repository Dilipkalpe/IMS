using IMS.Models;

namespace IMS.Services;

public sealed record SalesGridColumnDefinition(
    string Key,
    string Header,
    bool Mandatory,
    bool DefaultVisible);

public static class SalesGridColumnCatalog
{
    private static readonly SalesGridColumnDefinition BalStkColumn =
        new("balStk", "Bal Stk", false, true);

    private static readonly SalesGridColumnDefinition SaleRateColumn =
        new("salesRate", "Sale Rate", false, true);

    private static readonly HashSet<string> PurchaseModuleKeys = new(StringComparer.Ordinal)
    {
        "purchase_order", "grn", "purchase_invoice", "purchase_return"
    };

    public static readonly IReadOnlyList<SalesGridColumnDefinition> Columns =
    [
        new("actions", "Actions", true, true),
        new("sr", "Sr", true, true),
        new("code", "Code", true, true),
        new("itemDescription", "Item Description", true, true),
        new("qty", "Qty", true, true),
        new("rate", "Rate", false, true),
        new("discPercent", "Line Disc %", false, true),
        new("taxableValue", "Taxable Value", false, true),
        new("cgstPercent", "CGST %", false, true),
        new("cgstAmount", "CGST Amt", false, true),
        new("sgstPercent", "SGST %", false, true),
        new("sgstAmount", "SGST Amt", false, true),
        new("igstPercent", "IGST %", false, true),
        new("igstAmount", "IGST Amt", false, true),
        new("lineTotal", "Line Total", false, true)
    ];

    public static IReadOnlyList<SalesGridColumnDefinition> GetColumnsForModule(string? moduleKey)
    {
        var key = moduleKey ?? string.Empty;
        if (!PurchaseModuleKeys.Contains(key))
            return Columns;

        var columns = new List<SalesGridColumnDefinition>();
        foreach (var col in Columns)
        {
            if (col.Key == "qty")
                columns.Add(BalStkColumn);
            columns.Add(col);
            if (string.Equals(key, "purchase_invoice", StringComparison.Ordinal) && col.Key == "rate")
                columns.Add(SaleRateColumn);
        }

        return columns;
    }

    public static string ToModuleKey(PurchaseEntryType entryType) => entryType switch
    {
        PurchaseEntryType.PurchaseOrder => "purchase_order",
        PurchaseEntryType.Grn => "grn",
        PurchaseEntryType.PurchaseInvoice => "purchase_invoice",
        PurchaseEntryType.PurchaseReturn => "purchase_return",
        _ => "purchase_order"
    };

    public static string ToModuleKey(SalesEntryType entryType) => entryType switch
    {
        SalesEntryType.SalesOrder => "sales_order",
        SalesEntryType.SalesInvoice => "sales_invoice",
        SalesEntryType.DeliveryChallan => "delivery_challan",
        SalesEntryType.SalesReturn => "sales_return",
        _ => "sales_order"
    };

    public static PurchaseEntryType? TryParsePurchaseModuleKey(string? moduleKey) => moduleKey switch
    {
        "purchase_order" => PurchaseEntryType.PurchaseOrder,
        "grn" => PurchaseEntryType.Grn,
        "purchase_invoice" => PurchaseEntryType.PurchaseInvoice,
        "purchase_return" => PurchaseEntryType.PurchaseReturn,
        _ => null
    };

    public static SalesEntryType? TryParseModuleKey(string? moduleKey) => moduleKey switch
    {
        "sales_order" => SalesEntryType.SalesOrder,
        "sales_invoice" => SalesEntryType.SalesInvoice,
        "delivery_challan" => SalesEntryType.DeliveryChallan,
        "sales_return" => SalesEntryType.SalesReturn,
        _ => null
    };

    public static string GetModuleTitle(string moduleKey) => moduleKey switch
    {
        "sales_order" => "Sales Order",
        "sales_invoice" => "Sales Invoice",
        "delivery_challan" => "Delivery Challan",
        "sales_return" => "Sales Return",
        "purchase_order" => "Purchase Order",
        "grn" => "GRN",
        "purchase_invoice" => "Purchase Invoice",
        "purchase_return" => "Purchase Return",
        _ => moduleKey
    };

    public static IReadOnlyList<string> AllModuleKeys { get; } =
    [
        "sales_order", "sales_invoice", "delivery_challan", "sales_return",
        "purchase_order", "grn", "purchase_invoice", "purchase_return"
    ];

    public static IReadOnlyList<string> GetDefaultVisibleKeys(string? moduleKey) =>
        GetColumnsForModule(moduleKey).Where(c => c.DefaultVisible).Select(c => c.Key).ToList();

    public static IReadOnlyList<string> DefaultVisibleKeys => GetDefaultVisibleKeys("sales_order");

    public static IReadOnlySet<string> GetMandatoryKeys(string? moduleKey) =>
        GetColumnsForModule(moduleKey).Where(c => c.Mandatory).Select(c => c.Key).ToHashSet(StringComparer.Ordinal);

    public static IReadOnlySet<string> MandatoryKeys => GetMandatoryKeys("sales_order");

    public static IReadOnlyList<string> NormalizeVisibleKeys(IEnumerable<string>? keys, string? moduleKey = null)
    {
        var columns = GetColumnsForModule(moduleKey);
        var selected = keys?.ToHashSet(StringComparer.Ordinal) ?? [];
        var mandatory = GetMandatoryKeys(moduleKey);
        return columns
            .Where(c => mandatory.Contains(c.Key) || selected.Contains(c.Key))
            .Select(c => c.Key)
            .ToList();
    }
}
