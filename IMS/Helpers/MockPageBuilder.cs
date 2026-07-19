using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.ViewModels;

namespace IMS.Helpers;

internal static class MockPageBuilder
{
    public static MockPageViewModel Create(NavDefinition def) => new(
        def.Title,
        def.Description,
        def.IconGlyph,
        def.Col1, def.Col2, def.Col3, def.Col4,
        def.Stats ?? DefaultStats(def.Title),
        def.SeedRows ?? DefaultRows(def.Key));

    private static List<MockStat> DefaultStats(string title) =>
    [
        new("Total Records", "24", "\uE8EF", ThemeColors.Primary),
        new("This Month", "8", "\uE787", ThemeColors.Teal),
        new("Pending", "3", "\uE823", ThemeColors.Warning),
        new("Closed", "13", "\uE73E", ThemeColors.Success)
    ];

    private static MockRow[] DefaultRows(string key) =>
    [
        new() { Col1 = $"{Prefix(key)}-001", Col2 = "Sample A", Col3 = "Detail A", Col4 = "Open", Col5 = "01/05/2026", Status = "Open" },
        new() { Col1 = $"{Prefix(key)}-002", Col2 = "Sample B", Col3 = "Detail B", Col4 = "Posted", Col5 = "08/05/2026", Status = "Posted" },
        new() { Col1 = $"{Prefix(key)}-003", Col2 = "Sample C", Col3 = "Detail C", Col4 = "Draft", Col5 = "12/05/2026", Status = "Draft" },
        new() { Col1 = $"{Prefix(key)}-004", Col2 = "Sample D", Col3 = "Detail D", Col4 = "Closed", Col5 = "15/05/2026", Status = "Closed" }
    ];

    private static string Prefix(string key)
    {
        var parts = key.Split('-', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0)
            return "DOC";
        if (parts.Length == 1)
            return parts[0][..Math.Min(3, parts[0].Length)].ToUpperInvariant();
        return string.Concat(parts.Select(p => p.Length > 0 ? char.ToUpperInvariant(p[0]) : '?'));
    }
}
