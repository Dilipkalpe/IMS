using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class ProductTypesViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public ProductTypesViewModel(MainViewModel host) : base(
        "Product Type Master",
        "Define product types — raw material, component, finished good, etc.",
        "\uE8FD",
        "Type Code", "Type Name", "Description", "Status",
        [
            new("Total Types", "4", "\uE8FD", ThemeColors.Primary),
            new("Active", "4", "\uE73E", ThemeColors.Success),
            new("Used in Products", "1,248", "\uE7B8", ThemeColors.Slate),
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
            SubPageActionsFactory.Add(host, "Add Product Type", "\uE710", () => new AddProductTypeViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshProductTypes(this);

    protected override void OnRowDeleted(MockRow row)
    {
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteProductTypeByCodeAsync(row.Col1);
            ApiListLoader.RefreshProductTypes(this);
        });
        MessageBox.Show(
            $"Product type \"{row.Col2}\" ({row.Col1}) was deleted.",
            "Product Type Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        _host.NavigateToSubPage(new AddProductTypeViewModel(_host, row));
    }

    public void RefreshStats()
    {
        if (StatsList.Count < 2)
            return;

        var active = AllRows.Count(r => string.Equals(r.Status, "Active", StringComparison.OrdinalIgnoreCase));
        StatsList[0] = new MockStat("Total Types", AllRows.Count.ToString("N0"), "\uE8FD", ThemeColors.Primary);
        StatsList[1] = new MockStat("Active", active.ToString("N0"), "\uE73E", ThemeColors.Success);
        OnPropertyChanged(nameof(Stats));
    }
}
