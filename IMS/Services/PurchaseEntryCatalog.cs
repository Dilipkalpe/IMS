using IMS.Models;
using IMS.Resources;
using IMS.ViewModels;

namespace IMS.Services;

public sealed record PurchaseEntryDefinition(
    PurchaseEntryType EntryType,
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

public static class PurchaseEntryCatalog
{
    private static readonly IReadOnlyDictionary<PurchaseEntryType, PurchaseEntryDefinition> ByType =
        new Dictionary<PurchaseEntryType, PurchaseEntryDefinition>
        {
            [PurchaseEntryType.PurchaseOrder] = Create(
                PurchaseEntryType.PurchaseOrder, NavKeys.PurchaseOrders, "Sales Orders - Purchase Orders",
                "PO No", "Supplier", "Amount", "Tran Date",
                [new("Open POs", "34", "\uE719", ThemeColors.Primary), new("This Month", "$128K", "\uE73E", ThemeColors.Success), new("Awaiting GRN", "11", "\uE710", ThemeColors.Warning), new("Overdue", "2", "\uE7BA", ThemeColors.Danger)],
                [
                    new() { Col1 = "PO-24018", Col2 = "Acme Metals Ltd", Col3 = "$12,400", Col4 = "02/03/2026", Status = "Open" },
                    new() { Col1 = "PO-24019", Col2 = "Precision Parts Co", Col3 = "$8,950", Col4 = "04/03/2026", Status = "Open" },
                    new() { Col1 = "PO-24020", Col2 = "Global Polymers", Col3 = "$3,200", Col4 = "06/03/2026", Status = "Draft" },
                    new() { Col1 = "PO-24005", Col2 = "Fastener World", Col3 = "$1,100", Col4 = "28/02/2026", Status = "Closed" }
                ],
                "PO No", "PO", "Purchase Counter", "Add Purchase Order", "New PO", "PO Amt",
                "IMS — Purchase Order", 24018,
                "Procurement orders for raw materials and supplies (same layout as sales orders).",
                "\uE719"),

            [PurchaseEntryType.Grn] = Create(
                PurchaseEntryType.Grn, NavKeys.Grn, "Goods Receipt Note (GRN) / Purchase D.C.",
                "GRN No", "Supplier", "Qty", "Tran Date",
                [new("Open GRN", "9", "\uE8FB", ThemeColors.Primary), new("Received MTD", "56", "\uE73E", ThemeColors.Success), new("Pending PO", "4", "\uE823", ThemeColors.Warning), new("Rejected", "1", "\uE7BA", ThemeColors.Danger)],
                [
                    new() { Col1 = "GRN-901", Col2 = "Acme Metals Ltd", Col3 = "120", Col4 = "07/03/2026", Status = "Open" },
                    new() { Col1 = "GRN-902", Col2 = "Precision Parts Co", Col3 = "48", Col4 = "09/03/2026", Status = "Closed" },
                    new() { Col1 = "GRN-903", Col2 = "Global Polymers", Col3 = "22", Col4 = "11/03/2026", Status = "Open" }
                ],
                "GRN No", "GRN", "GRN / Purchase D.C.", "Add GRN", "New GRN", "Total Qty",
                "IMS — Goods Receipt Note", 901,
                "Goods receipt and purchase delivery challans.",
                "\uE8FB"),

            [PurchaseEntryType.PurchaseInvoice] = Create(
                PurchaseEntryType.PurchaseInvoice, NavKeys.PurchaseInvoice, "Purchase Invoice",
                "Invoice No", "Supplier", "Amount", "Tran Date",
                [new("Draft", "3", "\uE8A5", ThemeColors.Warning), new("Posted MTD", "94", "\uE73E", ThemeColors.Success), new("Unpaid", "18", "\uE8C8", ThemeColors.Primary), new("Cancelled", "1", "\uE7BA", ThemeColors.Danger)],
                [
                    new() { Col1 = "PI-4401", Col2 = "Acme Metals Ltd", Col3 = "$12,400", Col4 = "03/03/2026", Status = "Posted" },
                    new() { Col1 = "PI-4402", Col2 = "Precision Parts Co", Col3 = "$8,950", Col4 = "05/03/2026", Status = "Draft" },
                    new() { Col1 = "PI-4403", Col2 = "Fastener World", Col3 = "$1,100", Col4 = "07/03/2026", Status = "Closed" }
                ],
                "Invoice No", "PI", "Purchase Invoice", "Add Purchase Invoice", "New Invoice", "Invoice Amt",
                "IMS — Purchase Invoice", 4401,
                "Supplier invoices and payables.",
                "\uE8A5"),

            [PurchaseEntryType.PurchaseReturn] = Create(
                PurchaseEntryType.PurchaseReturn, NavKeys.PurchaseReturn, "Purchase Return",
                "Return No", "Supplier", "Amount", "Tran Date",
                [new("Open Returns", "5", "\uE10F", ThemeColors.Primary), new("Debit Note", "3", "\uE8C1", ThemeColors.Teal), new("Pending Approval", "2", "\uE823", ThemeColors.Warning), new("Rejected", "1", "\uE7BA", ThemeColors.Danger)],
                [
                    new() { Col1 = "PR-201", Col2 = "Acme Metals Ltd", Col3 = "$820", Col4 = "08/03/2026", Status = "Open" },
                    new() { Col1 = "PR-202", Col2 = "Global Polymers", Col3 = "$310", Col4 = "09/03/2026", Status = "Closed" },
                    new() { Col1 = "PR-203", Col2 = "Fastener World", Col3 = "$150", Col4 = "10/03/2026", Status = "Draft" }
                ],
                "Return No", "PR", "Purchase Return", "Add Purchase Return", "New Return", "Return Amt",
                "IMS — Purchase Return", 201,
                "Purchase returns to suppliers.",
                "\uE10F")
        };

    public static PurchaseEntryDefinition Get(PurchaseEntryType type) => ByType[type];

    public static string GetPrintHeaderTitle(PurchaseEntryType type)
    {
        var title = Get(type).PrintDocumentTitle;
        const string prefix = "IMS — ";
        return title.StartsWith(prefix, StringComparison.Ordinal)
            ? title[prefix.Length..]
            : title;
    }

    public static string GetPrintPreviousButtonLabel(PurchaseEntryType type) =>
        $"Print Previous ({GetPrintHeaderTitle(type)})";

    private static PurchaseEntryDefinition Create(
        PurchaseEntryType type, string navKey, string navTitle,
        string c1, string c2, string c3, string c4,
        IReadOnlyList<MockStat> stats, IReadOnlyList<MockRow> rows,
        string docNoLabel, string docPrefix, string counterLabel, string addTitle, string newDocBtn,
        string amountLabel, string printTitle, int initialDocNo,
        string listDescription, string icon) => new(
        type, navKey, navTitle, navTitle, listDescription, icon,
        c1, c2, c3, c4, stats, rows,
        docNoLabel, docPrefix, counterLabel, addTitle, newDocBtn, amountLabel, printTitle, initialDocNo);
}
