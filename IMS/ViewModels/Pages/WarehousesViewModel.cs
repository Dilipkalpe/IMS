using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class WarehousesViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public WarehousesViewModel(MainViewModel host) : base(
        "Warehouse Master",
        "Warehouses and godowns used for stock, production, and transfers.",
        "\uE7F4",
        "Code", "Warehouse Name", "Location", "Status",
        [
            new("Warehouses", "0", "\uE7F4", ThemeColors.Primary),
            new("Active", "0", "\uE73E", ThemeColors.Success),
            new("Locations", "0", "\uE8B7", ThemeColors.Slate),
            new("Last Updated", "Today", "\uE823", ThemeColors.Warning)
        ],
        [],
        enableDelete: true,
        expandRows: false)
    {
        _host = host;
        EditRowCommand = CreateEditRowCommand(EditRow);
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add Warehouse", "\uE710", () => new AddWarehouseViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshWarehouses(this);

    protected override void OnRowDeleted(MockRow row)
    {
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteWarehouseByCodeAsync(row.Col1);
            ApiListLoader.RefreshWarehouses(this);
        });
        MessageBox.Show(
            $"Warehouse \"{row.Col2}\" ({row.Col1}) was deleted.",
            "Warehouse Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        _host.NavigateToSubPage(new AddWarehouseViewModel(_host, row));
    }

    public void RefreshStats()
    {
        if (StatsList.Count < 3)
            return;

        var active = AllRows.Count(r => string.Equals(r.Status, "Active", StringComparison.OrdinalIgnoreCase));
        var locations = AllRows.Count(r => !string.IsNullOrWhiteSpace(r.Col3) && r.Col3 != "—");
        StatsList[0] = new MockStat("Warehouses", AllRows.Count.ToString("N0"), "\uE7F4", ThemeColors.Primary);
        StatsList[1] = new MockStat("Active", active.ToString("N0"), "\uE73E", ThemeColors.Success);
        StatsList[2] = new MockStat("Locations", locations.ToString("N0"), "\uE8B7", ThemeColors.Slate);
        OnPropertyChanged(nameof(Stats));
    }
}
