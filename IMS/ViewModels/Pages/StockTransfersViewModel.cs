using IMS.Resources;
using IMS.Services.Api;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class StockTransfersViewModel : MockPageViewModel
{
    public StockTransfersViewModel(MainViewModel host) : base(
        "Stock Transfer",
        "Inter-warehouse and inter-godown stock transfers.",
        "\uE8AB",
        "Transfer No", "From WH", "To WH", "Tran Date",
        [
            new("Open", "—", "\uE8AB", ThemeColors.Primary),
            new("Posted MTD", "—", "\uE73E", ThemeColors.Success),
            new("Pending", "—", "\uE823", ThemeColors.Warning),
            new("Cancelled", "—", "\uE7BA", ThemeColors.Danger)
        ],
        [])
    {
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add Stock Transfer", "\uE710", () => new StockTransferViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshStockTransfers(this);
}
