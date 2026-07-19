using IMS.Resources;

using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class StockMovementsViewModel : MockPageViewModel
{
    public StockMovementsViewModel(MainViewModel host) : base(
        "Stock Movements",
        "Receipts, issues, transfers, and adjustments.",
        "\uE8AB",
        "Doc No", "Type", "SKU", "Qty",
        [
            new("Today", "24", "\uE8AB", ThemeColors.Primary),
            new("Receipts", "12", "\uE710", ThemeColors.Success),
            new("Issues", "8", "\uE7E7", ThemeColors.Warning),
            new("Transfers", "4", "\uE8AD", ThemeColors.Purple)
        ],
        [
            new() { Col1 = "SM-24051", Col2 = "Receipt", Col3 = "RM-1001", Col4 = "+500 KG", Status = "Posted" },
            new() { Col1 = "SM-24052", Col2 = "Issue to MO", Col3 = "CP-2040", Col4 = "-20 EA", Status = "Posted" },
            new() { Col1 = "SM-24053", Col2 = "Transfer", Col3 = "FG-5001", Col4 = "50 EA", Status = "Pending" },
            new() { Col1 = "SM-24054", Col2 = "Adjustment", Col3 = "CP-2088", Col4 = "+10 EA", Status = "Draft" }
        ])
    {
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add Movement", "\uE710", () => new AddStockMovementViewModel(host))
        ];
    }
}
