using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class MachinesViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public MachinesViewModel(MainViewModel host) : base(
        "Machine Master",
        "Production machines used on work orders.",
        "\uE912",
        "Code", "Machine Name", "Description", "Status",
        [
            new("Machines", "0", "\uE912", ThemeColors.Primary),
            new("Active", "0", "\uE73E", ThemeColors.Success),
            new("In Production", "0", "\uE8FD", ThemeColors.Slate),
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
            SubPageActionsFactory.Add(host, "Add Machine", "\uE710", () => new AddMachineViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshMachines(this);

    protected override void OnRowDeleted(MockRow row)
    {
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteMachineByCodeAsync(row.Col1);
            ApiListLoader.RefreshMachines(this);
        });
        MessageBox.Show(
            $"Machine \"{row.Col2}\" ({row.Col1}) was deleted.",
            "Machine Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        _host.NavigateToSubPage(new AddMachineViewModel(_host, row));
    }

    public void RefreshStats()
    {
        if (StatsList.Count < 2)
            return;

        var active = AllRows.Count(r => string.Equals(r.Status, "Active", StringComparison.OrdinalIgnoreCase));
        StatsList[0] = new MockStat("Machines", AllRows.Count.ToString("N0"), "\uE912", ThemeColors.Primary);
        StatsList[1] = new MockStat("Active", active.ToString("N0"), "\uE73E", ThemeColors.Success);
        OnPropertyChanged(nameof(Stats));
    }
}
