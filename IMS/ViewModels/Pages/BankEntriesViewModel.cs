using System.Globalization;
using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class BankEntriesViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public BankEntriesViewModel(MainViewModel host) : base(
        "Bank Entry",
        "Bank deposits, withdrawals, and transfers.",
        "\uE825",
        "Entry No", "Type", "Amount", "Tran Date",
        [
            new("Total", "0", "\uE825", ThemeColors.Primary),
            new("Posted", "0", "\uE73E", ThemeColors.Success),
            new("Deposits", "0", "\uE8C7", ThemeColors.Teal),
            new("Amount MTD", "0", "\uE9D2", ThemeColors.Slate)
        ],
        [],
        enableDelete: true,
        expandRows: false)
    {
        _host = host;
        EditRowCommand = CreateEditRowCommand(EditRow);
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add Bank Entry", "\uE710", () => new BankEntryEntryViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshBankEntries(this);

    protected override void OnRowDeleted(MockRow row)
    {
        if (!int.TryParse(row.Col1, NumberStyles.Integer, CultureInfo.InvariantCulture, out var voucherNo))
            return;

        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteBankEntryByNoAsync(voucherNo);
            ApiListLoader.RefreshBankEntries(this);
        });
        MessageBox.Show(
            $"Bank entry #{row.Col1} was deleted.",
            "Bank Entry Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        if (!int.TryParse(row.Col1, NumberStyles.Integer, CultureInfo.InvariantCulture, out var voucherNo))
            return;

        _host.NavigateToSubPage(new BankEntryEntryViewModel(_host, voucherNo));
    }

    public void RefreshStats(IReadOnlyList<BankEntryDto> items)
    {
        if (StatsList.Count < 4)
            return;

        var posted = items.Count(i => string.Equals(i.Status, "Posted", StringComparison.OrdinalIgnoreCase));
        var deposits = items.Count(i =>
            string.Equals(i.CashBank, "DEPOSIT", StringComparison.OrdinalIgnoreCase));
        var totalAmount = items.Sum(i => i.Amount);

        StatsList[0] = new MockStat("Total", items.Count.ToString("N0"), "\uE825", ThemeColors.Primary);
        StatsList[1] = new MockStat("Posted", posted.ToString("N0"), "\uE73E", ThemeColors.Success);
        StatsList[2] = new MockStat("Deposits", deposits.ToString("N0"), "\uE8C7", ThemeColors.Teal);
        StatsList[3] = new MockStat("Amount MTD", totalAmount.ToString("N2"), "\uE9D2", ThemeColors.Slate);
        OnPropertyChanged(nameof(Stats));
    }
}
