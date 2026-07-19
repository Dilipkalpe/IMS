using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class ProductMainGroupsViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public ProductMainGroupsViewModel(MainViewModel host) : base(
        "Product Main Group Master",
        "Top-level product classification groups.",
        "\uE8B7",
        "Group Code", "Group Name", "Description", "Status",
        [
            new("Main Groups", "5", "\uE8B7", ThemeColors.Primary),
            new("Active", "5", "\uE73E", ThemeColors.Success),
            new("Sub Groups", "12", "\uE8FD", ThemeColors.Purple),
            new("Products", "486", "\uE7B8", ThemeColors.Slate)
        ],
        [],
        enableDelete: true,
        expandRows: false)
    {
        _host = host;
        EditRowCommand = CreateEditRowCommand(EditRow);
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add Main Group", "\uE710", () => new AddProductMainGroupViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshProductMainGroups(this);

    protected override void OnRowDeleted(MockRow row)
    {
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteProductMainGroupByCodeAsync(row.Col1);
            ApiListLoader.RefreshProductMainGroups(this);
        });
        MessageBox.Show(
            $"Main group \"{row.Col2}\" ({row.Col1}) was deleted.",
            "Main Group Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        _host.NavigateToSubPage(new AddProductMainGroupViewModel(_host, row));
    }

    public void RefreshStats(int subGroupCount = 0, int productCount = 0)
    {
        if (StatsList.Count < 4)
            return;

        var active = AllRows.Count(r => string.Equals(r.Status, "Active", StringComparison.OrdinalIgnoreCase));
        StatsList[0] = new MockStat("Main Groups", AllRows.Count.ToString("N0"), "\uE8B7", ThemeColors.Primary);
        StatsList[1] = new MockStat("Active", active.ToString("N0"), "\uE73E", ThemeColors.Success);
        StatsList[2] = new MockStat("Sub Groups", subGroupCount.ToString("N0"), "\uE8FD", ThemeColors.Purple);
        StatsList[3] = new MockStat("Products", productCount.ToString("N0"), "\uE7B8", ThemeColors.Slate);
        OnPropertyChanged(nameof(Stats));
    }
}

