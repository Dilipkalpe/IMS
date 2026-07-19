using IMS.Models;
using IMS.Resources;
using IMS.ViewModels;

namespace IMS.Services;

public static class CustomerTypeCatalog
{
    public const string NavTitle = "Customer Types";
    public const string PageTitle = "Customer Type Master";
    public const string PageDescription = "Define customer / account types used in Account Master and sales.";
    public const string IconGlyph = "\uE77B";

    public static IReadOnlyList<MockStat> Stats =>
    [
        new("Total Types", "8", "\uE77B", ThemeColors.Primary),
        new("Active", "8", "\uE73E", ThemeColors.Success),
        new("Used in Accounts", "312", "\uE8C8", ThemeColors.Slate),
        new("Last Updated", "Today", "\uE823", ThemeColors.Warning)
    ];

    public static IReadOnlyList<MockRow> SeedRows { get; } =
    [
        new() { Col1 = "CT-CUS", Col2 = "Customer", Col3 = "Standard customer account", Col4 = "Active", Status = "Active" },
        new() { Col1 = "CT-SUP", Col2 = "Supplier", Col3 = "Vendor / supplier account", Col4 = "Active", Status = "Active" },
        new() { Col1 = "CT-BTH", Col2 = "Customer & Supplier", Col3 = "Both customer and supplier", Col4 = "Active", Status = "Active" },
        new() { Col1 = "CT-DLR", Col2 = "Dealer", Col3 = "Dealer channel partner", Col4 = "Active", Status = "Active" },
        new() { Col1 = "CT-DST", Col2 = "Distributor", Col3 = "Distributor account", Col4 = "Active", Status = "Active" },
        new() { Col1 = "CT-CSH", Col2 = "Cash", Col3 = "Cash ledger type", Col4 = "Active", Status = "Active" },
        new() { Col1 = "CT-BNK", Col2 = "Bank", Col3 = "Bank account type", Col4 = "Active", Status = "Active" },
        new() { Col1 = "CT-EXP", Col2 = "Expense", Col3 = "Expense account type", Col4 = "Active", Status = "Active" }
    ];

    private static List<string> _customerTypeNames = SeedRows.Select(r => r.Col2).Distinct().ToList();

    public static IReadOnlyList<string> CustomerTypeNames => _customerTypeNames;

    public static void SetCustomerTypeNames(IEnumerable<string> names)
    {
        var list = names.Where(n => !string.IsNullOrWhiteSpace(n)).Distinct().ToList();
        if (list.Count == 0)
            return;
        _customerTypeNames = list;
    }
}
