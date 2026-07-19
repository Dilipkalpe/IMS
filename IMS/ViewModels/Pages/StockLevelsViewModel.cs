using IMS.Resources;

namespace IMS.ViewModels;

public sealed class StockLevelsViewModel : MockPageViewModel
{
    public StockLevelsViewModel() : base(
        "Stock Levels",
        "On-hand quantity by product and warehouse location.",
        "\uE74C",
        "SKU", "Warehouse", "On Hand", "Available",
        [
            new("Total Units", "48,920", "\uE74C", ThemeColors.Primary),
            new("Reserved", "6,140", "\uE8A1", ThemeColors.Warning),
            new("Below Reorder", "18", "\uE7BA", ThemeColors.Danger),
            new("In Transit", "2,400", "\uE8AB", ThemeColors.Success)
        ],
        [
            new() { Col1 = "FG-5001", Col2 = "Main WH", Col3 = "320", Col4 = "280", Status = "OK" },
            new() { Col1 = "RM-1001", Col2 = "Raw Store", Col3 = "1,200 KG", Col4 = "900 KG", Status = "OK" },
            new() { Col1 = "CP-2040", Col2 = "Assembly WH", Col3 = "45", Col4 = "12", Status = "Low" },
            new() { Col1 = "CP-2088", Col2 = "Main WH", Col3 = "0", Col4 = "0", Status = "Out" }
        ])
    { }
}
