using IMS.Resources;

namespace IMS.ViewModels;

public sealed class ReportsViewModel : MockPageViewModel
{
    public ReportsViewModel() : base(
        "Reports",
        "Inventory valuation, production, and procurement analytics.",
        "\uE9D9",
        "Report", "Category", "Last Run", "Format",
        [
            new("Scheduled", "14", "\uE823", ThemeColors.Primary),
            new("Favorites", "6", "\uE734", ThemeColors.Success),
            new("Exports Today", "3", "\uE8A5", ThemeColors.Warning),
            new("Custom", "2", "\uE70F", ThemeColors.Purple)
        ],
        [
            new() { Col1 = "Stock Valuation", Col2 = "Inventory", Col3 = "Today 08:00", Col4 = "PDF", Status = "Ready" },
            new() { Col1 = "BOM Explosion", Col2 = "Production", Col3 = "Yesterday", Col4 = "Excel", Status = "Ready" },
            new() { Col1 = "MO Consumption", Col2 = "Production", Col3 = "Today 06:30", Col4 = "PDF", Status = "Ready" },
            new() { Col1 = "Supplier OTIF", Col2 = "Procurement", Col3 = "Weekly", Col4 = "Excel", Status = "Scheduled" }
        ])
    { }
}
