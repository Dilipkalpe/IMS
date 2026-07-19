using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class ProductSubGroupsViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public ProductSubGroupsViewModel(MainViewModel host) : base(
        "Product Sub Group Master",
        "Sub-classification linked to a main group.",
        "\uE8B7",
        "Sub Code", "Sub Name", "Main Group", "Status",
        [
            new("Sub Groups", "12", "\uE8B7", ThemeColors.Purple),
            new("Active", "11", "\uE73E", ThemeColors.Success),
            new("Main Groups", "5", "\uE8FD", ThemeColors.Primary),
            new("Unmapped", "1", "\uE7BA", ThemeColors.Warning)
        ],
        [],
        enableDelete: true,
        expandRows: false)
    {
        _host = host;
        EditRowCommand = CreateEditRowCommand(EditRow);
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add Sub Group", "\uE710", () => new AddProductSubGroupViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshProductSubGroups(this);

    protected override void OnRowDeleted(MockRow row)
    {
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteProductSubGroupByCodeAsync(row.Col1);
            ApiListLoader.RefreshProductSubGroups(this);
        });
        MessageBox.Show(
            $"Sub group \"{row.Col2}\" ({row.Col1}) was deleted.",
            "Sub Group Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        _host.NavigateToSubPage(new AddProductSubGroupViewModel(_host, row));
    }

    public void RefreshStats(int mainGroupCount = 0)
    {
        if (StatsList.Count < 4)
            return;

        var active = AllRows.Count(r => string.Equals(r.Status, "Active", StringComparison.OrdinalIgnoreCase));
        var knownMainGroups = ClassificationMasterCatalog.MainGroupNames
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var unmapped = AllRows.Count(r =>
            string.IsNullOrWhiteSpace(r.Col3) ||
            r.Col3 == "—" ||
            !knownMainGroups.Contains(r.Col3));

        StatsList[0] = new MockStat("Sub Groups", AllRows.Count.ToString("N0"), "\uE8B7", ThemeColors.Purple);
        StatsList[1] = new MockStat("Active", active.ToString("N0"), "\uE73E", ThemeColors.Success);
        StatsList[2] = new MockStat("Main Groups", mainGroupCount.ToString("N0"), "\uE8FD", ThemeColors.Primary);
        StatsList[3] = new MockStat("Unmapped", unmapped.ToString("N0"), "\uE7BA", ThemeColors.Warning);
        OnPropertyChanged(nameof(Stats));
    }
}

