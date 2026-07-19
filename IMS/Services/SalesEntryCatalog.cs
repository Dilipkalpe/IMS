using IMS.Models;
using IMS.Resources;
using IMS.ViewModels;

namespace IMS.Services;

public sealed record SalesEntryDefinition(
    SalesEntryType EntryType,
    string NavKey,
    string NavTitle,
    string ListPageTitle,
    string ListDescription,
    string IconGlyph,
    string Col1Header,
    string Col2Header,
    string Col3Header,
    string Col4Header,
    IReadOnlyList<MockStat> Stats,
    IReadOnlyList<MockRow> SeedRows,
    string DocNoLabel,
    string DocPrefix,
    string CounterLabel,
    string AddActionTitle,
    string NewDocButtonText,
    string AmountTotalLabel,
    string PrintDocumentTitle,
    int InitialDocNo);

public static class SalesEntryCatalog
{
    private static readonly IReadOnlyDictionary<SalesEntryType, SalesEntryDefinition> ByType =
        new Dictionary<SalesEntryType, SalesEntryDefinition>
        {
            [SalesEntryType.SalesOrder] = Create(
                SalesEntryType.SalesOrder, NavKeys.SalesOrders, "Sales Order",
                "SO No", "Customer", "Amount", "Tran Date",
                [new("Open Orders", "0", "\uE77F", ThemeColors.Primary), new("To Ship", "0", "\uE7B8", ThemeColors.Warning), new("Shipped", "0", "\uE73E", ThemeColors.Success), new("Cancelled", "0", "\uE711", ThemeColors.Danger)],
                [
                    new() { Col1 = "SO-88012", Col2 = "North Industries", Col3 = "$24,500", Col4 = "15/03/2026", Status = "Open" },
                    new() { Col1 = "SO-88013", Col2 = "Delta Manufacturing", Col3 = "$18,200", Col4 = "18/03/2026", Status = "Open" },
                    new() { Col1 = "SO-88014", Col2 = "Pacific Utilities", Col3 = "$9,800", Col4 = "20/03/2026", Status = "Closed" }
                ],
                "Bill No", "SO", "Sales Counter", "Add Sales Order", "New Bill", "Sale Amt",
                "IMS — Sales Bill", 2640),

            [SalesEntryType.DeliveryChallan] = Create(
                SalesEntryType.DeliveryChallan, NavKeys.DeliveryChallan, "Delivery Challan (D.C.)",
                "DC No", "Customer", "Qty", "Tran Date",
                [new("Open D.C.", "14", "\uE7BF", ThemeColors.Primary), new("Dispatched", "42", "\uE7E7", ThemeColors.Success), new("Pending SO", "6", "\uE823", ThemeColors.Warning), new("Cancelled", "1", "\uE7BA", ThemeColors.Danger)],
                [
                    new() { Col1 = "DC-1201", Col2 = "North Industries", Col3 = "48", Col4 = "12/03/2026", Status = "Open" },
                    new() { Col1 = "DC-1202", Col2 = "Summit Corp", Col3 = "120", Col4 = "14/03/2026", Status = "Closed" },
                    new() { Col1 = "DC-1203", Col2 = "Metro Traders", Col3 = "22", Col4 = "16/03/2026", Status = "Open" }
                ],
                "D.C. No", "DC", "Delivery Challan", "Add Delivery Challan", "New D.C.", "Total Qty",
                "IMS — Delivery Challan", 1200),

            [SalesEntryType.SalesInvoice] = Create(
                SalesEntryType.SalesInvoice, NavKeys.SalesInvoice, "Tax Invoice / Sales Invoice",
                "Invoice No", "Customer", "Amount", "Tran Date",
                [new("Draft", "5", "\uE8A5", ThemeColors.Warning), new("Posted MTD", "186", "\uE73E", ThemeColors.Success), new("Unpaid", "23", "\uE8C8", ThemeColors.Primary), new("Cancelled", "2", "\uE7BA", ThemeColors.Danger)],
                [
                    new() { Col1 = "INV-5501", Col2 = "North Industries", Col3 = "$24,500", Col4 = "01/03/2026", Status = "Posted" },
                    new() { Col1 = "INV-5502", Col2 = "Delta Manufacturing", Col3 = "$18,200", Col4 = "05/03/2026", Status = "Draft" },
                    new() { Col1 = "INV-5503", Col2 = "Pacific Utilities", Col3 = "$9,800", Col4 = "08/03/2026", Status = "Closed" }
                ],
                "Invoice No", "INV", "Sales Invoice", "Add Sales Invoice", "New Invoice", "Invoice Amt",
                "IMS — Tax Invoice", 5500),

            [SalesEntryType.SalesReturn] = Create(
                SalesEntryType.SalesReturn, NavKeys.SalesReturn, "Sales Return",
                "Return No", "Customer", "Amount", "Tran Date",
                [new("Open Returns", "7", "\uE10F", ThemeColors.Primary), new("Credit Note", "4", "\uE8C1", ThemeColors.Teal), new("Pending Approval", "2", "\uE823", ThemeColors.Warning), new("Rejected", "1", "\uE7BA", ThemeColors.Danger)],
                [
                    new() { Col1 = "SR-301", Col2 = "North Industries", Col3 = "$1,200", Col4 = "10/03/2026", Status = "Open" },
                    new() { Col1 = "SR-302", Col2 = "Summit Corp", Col3 = "$450", Col4 = "11/03/2026", Status = "Closed" },
                    new() { Col1 = "SR-303", Col2 = "Metro Traders", Col3 = "$890", Col4 = "12/03/2026", Status = "Draft" }
                ],
                "Return No", "SR", "Sales Return", "Add Sales Return", "New Return", "Return Amt",
                "IMS — Sales Return", 301)
        };

    private static readonly IReadOnlyDictionary<string, SalesEntryType> ByNavKey =
        ByType.Values.ToDictionary(d => d.NavKey, d => d.EntryType, StringComparer.Ordinal);

    public static SalesEntryDefinition Get(SalesEntryType type) => ByType[type];

    /// <summary>Title shown on printed documents and print preview (e.g. Sales Bill, Delivery Challan).</summary>
    public static string GetPrintHeaderTitle(SalesEntryType type)
    {
        var title = Get(type).PrintDocumentTitle;
        const string prefix = "IMS — ";
        return title.StartsWith(prefix, StringComparison.Ordinal)
            ? title[prefix.Length..]
            : title;
    }

    public static string GetPrintPreviousButtonLabel(SalesEntryType type) =>
        $"Print Previous ({GetPrintHeaderTitle(type)})";

    public static SalesEntryType GetTypeFromNavKey(string? navKey) =>
        navKey is not null && ByNavKey.TryGetValue(navKey, out var type)
            ? type
            : SalesEntryType.SalesOrder;

    public static bool IsSalesEntryNavKey(string? navKey) =>
        navKey is not null && ByNavKey.ContainsKey(navKey);

    private static SalesEntryDefinition Create(
        SalesEntryType type, string navKey, string navTitle,
        string c1, string c2, string c3, string c4,
        IReadOnlyList<MockStat> stats, IReadOnlyList<MockRow> rows,
        string docNoLabel, string docPrefix, string counterLabel, string addTitle, string newDocBtn,
        string amountLabel, string printTitle, int initialDocNo) => new(
        type, navKey, navTitle, navTitle,
        GetListDescription(type), GetIcon(type),
        c1, c2, c3, c4, stats, rows,
        docNoLabel, docPrefix, counterLabel, addTitle, newDocBtn, amountLabel, printTitle, initialDocNo);

    private static string GetListDescription(SalesEntryType type) => type switch
    {
        SalesEntryType.SalesOrder => "Customer orders and fulfillment status.",
        SalesEntryType.DeliveryChallan => "Delivery challans against sales orders.",
        SalesEntryType.SalesInvoice => "Tax invoices and sales billing.",
        SalesEntryType.SalesReturn => "Sales returns and credit notes.",
        _ => "Sales entry list."
    };

    private static string GetIcon(SalesEntryType type) => type switch
    {
        SalesEntryType.SalesOrder => "\uE8A1",
        SalesEntryType.DeliveryChallan => "\uE7BF",
        SalesEntryType.SalesInvoice => "\uE8A5",
        SalesEntryType.SalesReturn => "\uE10F",
        _ => "\uE8A1"
    };
}
