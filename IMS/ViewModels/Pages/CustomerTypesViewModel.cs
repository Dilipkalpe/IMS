using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class CustomerTypesViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public CustomerTypesViewModel(MainViewModel host) : base(
        CustomerTypeCatalog.PageTitle,
        CustomerTypeCatalog.PageDescription,
        CustomerTypeCatalog.IconGlyph,
        "Type Code", "Type Name", "Description", "Status",
        CustomerTypeCatalog.Stats,
        [],
        enableDelete: true,
        expandRows: false)
    {
        _host = host;
        EditRowCommand = CreateEditRowCommand(EditRow);
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add Customer Type", "\uE710", () => new AddCustomerTypeViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshCustomerTypes(this);

    protected override void OnRowDeleted(MockRow row)
    {
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteCustomerTypeByCodeAsync(row.Col1);
            ApiListLoader.RefreshCustomerTypes(this);
        });
        MessageBox.Show(
            $"Customer type \"{row.Col2}\" ({row.Col1}) was deleted.",
            "Customer Type Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        _host.NavigateToSubPage(new AddCustomerTypeViewModel(_host, row));
    }

    public void RefreshStats(int accountCount = 0)
    {
        if (StatsList.Count < 4)
            return;

        var active = AllRows.Count(r => string.Equals(r.Status, "Active", StringComparison.OrdinalIgnoreCase));
        StatsList[0] = new MockStat("Total Types", AllRows.Count.ToString("N0"), "\uE77B", ThemeColors.Primary);
        StatsList[1] = new MockStat("Active", active.ToString("N0"), "\uE73E", ThemeColors.Success);
        StatsList[2] = new MockStat("Used in Accounts", accountCount.ToString("N0"), "\uE8C8", ThemeColors.Slate);
        StatsList[3] = new MockStat("Last Updated", "Today", "\uE823", ThemeColors.Warning);
        OnPropertyChanged(nameof(Stats));
    }
}
