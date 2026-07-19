using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class SaleUomsViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public SaleUomsViewModel(MainViewModel host) : base(
        "Sale Unit of Measure Master",
        "Units used for sales and customer orders.",
        "\uE7C5",
        "Code", "UOM Name", "Decimals", "Status",
        [
            new("Sale UOMs", "6", "\uE7C5", ThemeColors.Primary),
            new("Active", "6", "\uE73E", ThemeColors.Success),
            new("Default", "EA", "\uE8A1", ThemeColors.Warning),
            new("Products", "892", "\uE7B8", ThemeColors.Slate)
        ],
        [],
        enableDelete: true,
        expandRows: false)
    {
        _host = host;
        EditRowCommand = CreateEditRowCommand(EditRow);
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add Sale UOM", "\uE710", () => new AddSaleUomViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshSaleUoms(this);

    protected override void OnRowDeleted(MockRow row)
    {
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteSaleUomByCodeAsync(row.Col1);
            ApiListLoader.RefreshSaleUoms(this);
        });
        MessageBox.Show(
            $"Sale UOM \"{row.Col2}\" ({row.Col1}) was deleted.",
            "Sale UOM Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        _host.NavigateToSubPage(new AddSaleUomViewModel(_host, row));
    }

    public void RefreshStats(int productCount = 0)
    {
        if (StatsList.Count < 4)
            return;

        var active = AllRows.Count(r => string.Equals(r.Status, "Active", StringComparison.OrdinalIgnoreCase));
        var defaultSymbol = AllRows
            .FirstOrDefault(r => string.Equals(r.Col2, "Each", StringComparison.OrdinalIgnoreCase))?.Col3
            ?? AllRows.FirstOrDefault()?.Col3
            ?? "EA";

        StatsList[0] = new MockStat("Sale UOMs", AllRows.Count.ToString("N0"), "\uE7C5", ThemeColors.Primary);
        StatsList[1] = new MockStat("Active", active.ToString("N0"), "\uE73E", ThemeColors.Success);
        StatsList[2] = new MockStat("Default", defaultSymbol, "\uE8A1", ThemeColors.Warning);
        StatsList[3] = new MockStat("Products", productCount.ToString("N0"), "\uE7B8", ThemeColors.Slate);
        OnPropertyChanged(nameof(Stats));
    }
}
