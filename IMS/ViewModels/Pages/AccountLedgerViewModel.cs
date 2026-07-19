using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class AccountLedgerViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public AccountLedgerViewModel(MainViewModel host) : base(
        "Chart of Accounts",
        "Customer and ledger accounts — contact, tax, credit, and location.",
        "\uE8C8",
        "Code", "Account", "Group", "Status",
        [
            new("Active Accounts", "0", "\uE8C8", ThemeColors.Primary),
            new("Customers", "0", "\uE716", ThemeColors.Teal),
            new("Suppliers", "0", "\uE8F1", ThemeColors.Slate),
            new("GST Registered", "0", "\uE8A5", ThemeColors.Success)
        ],
        [],
        enableDelete: true,
        expandRows: false)
    {
        _host = host;
        EditRowCommand = CreateEditRowCommand(EditRow);
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add Account", "\uE710", () => new AddAccountMasterViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshAccounts(this);

    protected override void OnRowDeleted(MockRow row)
    {
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteAccountByCodeAsync(row.Col1);
            ApiListLoader.RefreshAccounts(this);
        });
        MessageBox.Show(
            $"Account \"{row.Col2}\" ({row.Col1}) was deleted.",
            "Account Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        _host.NavigateToSubPage(new AddAccountMasterViewModel(_host, row.Col1));
    }

    public void RefreshStats(IReadOnlyList<AccountDto> accounts)
    {
        if (StatsList.Count < 4)
            return;

        var active = accounts.Count(a => a.ActiveStatus);
        var customers = accounts.Count(a => string.Equals(a.AccountType, "customer", StringComparison.OrdinalIgnoreCase));
        var suppliers = accounts.Count(a => string.Equals(a.AccountType, "supplier", StringComparison.OrdinalIgnoreCase));
        var gstRegistered = accounts.Count(a => !string.IsNullOrWhiteSpace(a.GstNo));

        StatsList[0] = new MockStat("Active Accounts", active.ToString("N0"), "\uE8C8", ThemeColors.Primary);
        StatsList[1] = new MockStat("Customers", customers.ToString("N0"), "\uE716", ThemeColors.Teal);
        StatsList[2] = new MockStat("Suppliers", suppliers.ToString("N0"), "\uE8F1", ThemeColors.Slate);
        StatsList[3] = new MockStat("GST Registered", gstRegistered.ToString("N0"), "\uE8A5", ThemeColors.Success);
        OnPropertyChanged(nameof(Stats));
    }
}
