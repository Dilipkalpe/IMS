using IMS.Models;
using IMS.Resources;
using IMS.ViewModels;

namespace IMS.Services;

public static class CompanyCatalog
{
    public const string NavTitle = "Company Registration";
    public const string PageTitle = "Company Registration";
    public const string PageDescription =
        "Register your business for tax invoices, letterheads, and sales documents.";
    public const string IconGlyph = "\uE731";

    public static IReadOnlyList<MockStat> Stats =>
    [
        new("Registered", "1", "\uE731", ThemeColors.Primary),
        new("Default Company", "RAJ CLOTH CENTER", "\uE73E", ThemeColors.Success),
        new("With GSTIN", "1", "\uE8A5", ThemeColors.Slate),
        new("Last Updated", "Today", "\uE823", ThemeColors.Warning)
    ];

    public static IReadOnlyList<MockRow> SeedRows { get; } =
    [
        new()
        {
            Col1 = "RAJ",
            Col2 = "RAJ CLOTH CENTER",
            Col3 = "27ARDPP7668M1ZX",
            Col4 = "Yes",
            Status = "Active"
        }
    ];
}
