using System.Globalization;
using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class CashEntriesViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public CashEntriesViewModel(MainViewModel host) : base(
        "Petty Cash / Cash Expense",
        "Petty cash expenses and reimbursements.",
        "\uE8C4",
        "Entry No", "Category", "Amount", "Tran Date",
        [
            new("Total", "0", "\uE8C4", ThemeColors.Primary),
            new("Posted", "0", "\uE73E", ThemeColors.Success),
            new("Lines", "0", "\uE8A5", ThemeColors.Purple),
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
            SubPageActionsFactory.Add(host, "Add Cash Entry", "\uE710", () => new CashEntryEntryViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshCashEntries(this);

    protected override void OnRowDeleted(MockRow row)
    {
        if (!int.TryParse(row.Col1, NumberStyles.Integer, CultureInfo.InvariantCulture, out var entryNo))
            return;

        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteCashEntryByNoAsync(entryNo);
            ApiListLoader.RefreshCashEntries(this);
        });
        MessageBox.Show(
            $"Cash entry #{row.Col1} was deleted.",
            "Cash Entry Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        if (!int.TryParse(row.Col1, NumberStyles.Integer, CultureInfo.InvariantCulture, out var entryNo))
            return;

        _host.NavigateToSubPage(new CashEntryEntryViewModel(_host, entryNo));
    }

    public void RefreshStats(IReadOnlyList<CashEntryDto> items)
    {
        if (StatsList.Count < 4)
            return;

        var posted = items.Count(i => string.Equals(i.Status, "Posted", StringComparison.OrdinalIgnoreCase));
        var lineCount = items.Sum(i => i.Lines.Count);
        var totalAmount = items.Sum(i => i.TotalAmount);

        StatsList[0] = new MockStat("Total", items.Count.ToString("N0"), "\uE8C4", ThemeColors.Primary);
        StatsList[1] = new MockStat("Posted", posted.ToString("N0"), "\uE73E", ThemeColors.Success);
        StatsList[2] = new MockStat("Lines", lineCount.ToString("N0"), "\uE8A5", ThemeColors.Purple);
        StatsList[3] = new MockStat("Amount MTD", totalAmount.ToString("N2"), "\uE9D2", ThemeColors.Slate);
        OnPropertyChanged(nameof(Stats));
    }
}
