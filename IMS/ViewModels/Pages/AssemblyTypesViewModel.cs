using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class AssemblyTypesViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public AssemblyTypesViewModel(MainViewModel host) : base(
        "Assembly Type Master",
        "Assembly classification for BOM and production.",
        "\uE8F1",
        "Code", "Assembly Type", "Description", "Status",
        [
            new("Types", "3", "\uE8F1", ThemeColors.Purple),
            new("Active", "3", "\uE73E", ThemeColors.Success),
            new("BOM Lines", "186", "\uE8FD", ThemeColors.Primary),
            new("MOs Using", "12", "\uE912", ThemeColors.Warning)
        ],
        [],
        enableDelete: true,
        expandRows: false)
    {
        _host = host;
        EditRowCommand = CreateEditRowCommand(EditRow);
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add Assembly Type", "\uE710", () => new AddAssemblyTypeViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshAssemblyTypes(this);

    protected override void OnRowDeleted(MockRow row)
    {
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteAssemblyTypeByCodeAsync(row.Col1);
            ApiListLoader.RefreshAssemblyTypes(this);
        });
        MessageBox.Show(
            $"Assembly type \"{row.Col2}\" ({row.Col1}) was deleted.",
            "Assembly Type Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        _host.NavigateToSubPage(new AddAssemblyTypeViewModel(_host, row));
    }

    public void RefreshStats()
    {
        if (StatsList.Count < 2)
            return;

        var active = AllRows.Count(r => string.Equals(r.Status, "Active", StringComparison.OrdinalIgnoreCase));
        StatsList[0] = new MockStat("Types", AllRows.Count.ToString("N0"), "\uE8F1", ThemeColors.Purple);
        StatsList[1] = new MockStat("Active", active.ToString("N0"), "\uE73E", ThemeColors.Success);
        OnPropertyChanged(nameof(Stats));
    }
}
