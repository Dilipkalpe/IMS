using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class UsersViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public UsersViewModel(MainViewModel host) : base(
        "Users",
        "Users, roles, and permissions.",
        "\uE77B",
        "Login", "Role", "Department", "Status",
        [
            new("Total Users", "0", "\uE77B", ThemeColors.Primary),
            new("Active", "0", "\uE73E", ThemeColors.Success),
            new("Admins", "0", "\uE8D7", ThemeColors.Purple),
            new("Departments", "0", "\uE8F1", ThemeColors.Slate)
        ],
        [],
        enableDelete: true,
        expandRows: false)
    {
        _host = host;
        EditRowCommand = CreateEditRowCommand(EditRow);
        SubPageActions =
        [
            new SubPageAction
            {
                Title = "Add User",
                IconGlyph = "\uE710",
                Command = new AsyncRelayCommand(async () =>
                {
                    var roles = await AddUserViewModel.GetRoleOptionsAsync();
                    host.NavigateToSubPage(new AddUserViewModel(host, roles));
                })
            }
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshUsers(this);

    protected override void OnRowDeleted(MockRow row)
    {
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteUserByUsernameAsync(row.Col1);
            ApiListLoader.RefreshUsers(this);
        });
        MessageBox.Show(
            $"User \"{row.Col1}\" was deleted.",
            "User Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row) => _ = EditRowAsync(row);

    private async Task EditRowAsync(MockRow row)
    {
        var roles = await AddUserViewModel.GetRoleOptionsAsync();
        _host.NavigateToSubPage(new AddUserViewModel(_host, row, roles));
    }

    public void RefreshStats()
    {
        if (StatsList.Count < 4)
            return;

        var active = AllRows.Count(r => string.Equals(r.Status, "Active", StringComparison.OrdinalIgnoreCase));
        var admins = AllRows.Count(r =>
            string.Equals(r.Col2, "Administrator", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(r.Col2, "Admin", StringComparison.OrdinalIgnoreCase));
        var departments = AllRows.Select(r => r.Col3).Where(d => !string.IsNullOrWhiteSpace(d) && d != "—").Distinct().Count();

        StatsList[0] = new MockStat("Total Users", AllRows.Count.ToString("N0"), "\uE77B", ThemeColors.Primary);
        StatsList[1] = new MockStat("Active", active.ToString("N0"), "\uE73E", ThemeColors.Success);
        StatsList[2] = new MockStat("Admins", admins.ToString("N0"), "\uE8D7", ThemeColors.Purple);
        StatsList[3] = new MockStat("Departments", departments.ToString("N0"), "\uE8F1", ThemeColors.Slate);
        OnPropertyChanged(nameof(Stats));
    }
}
