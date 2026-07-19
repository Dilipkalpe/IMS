using System.Globalization;
using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class DebitNotesViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public DebitNotesViewModel(MainViewModel host) : base(
        "Debit Note",
        "Debit notes issued to parties.",
        "\uE8C0",
        "Note No", "Party", "Amount", "Tran Date",
        [
            new("Total", "0", "\uE8C0", ThemeColors.Primary),
            new("Posted", "0", "\uE73E", ThemeColors.Success),
            new("IGST", "0", "\uE8A5", ThemeColors.Purple),
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
            SubPageActionsFactory.Add(host, "Add Debit Note", "\uE710", () => new DebitNoteEntryViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshDebitNotes(this);

    protected override void OnRowDeleted(MockRow row)
    {
        if (!int.TryParse(row.Col1, NumberStyles.Integer, CultureInfo.InvariantCulture, out var voucherNo))
            return;

        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteDebitNoteByNoAsync(voucherNo);
            ApiListLoader.RefreshDebitNotes(this);
        });
        MessageBox.Show(
            $"Debit note #{row.Col1} was deleted.",
            "Debit Note Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        if (!int.TryParse(row.Col1, NumberStyles.Integer, CultureInfo.InvariantCulture, out var voucherNo))
            return;

        _host.NavigateToSubPage(new DebitNoteEntryViewModel(_host, voucherNo));
    }

    public void RefreshStats(IReadOnlyList<DebitNoteDto> items)
    {
        if (StatsList.Count < 4)
            return;

        var posted = items.Count(i => string.Equals(i.Status, "Posted", StringComparison.OrdinalIgnoreCase));
        var igst = items.Count(i => i.IsIgst);
        var totalAmount = items.Sum(i => i.TotalAmount);

        StatsList[0] = new MockStat("Total", items.Count.ToString("N0"), "\uE8C0", ThemeColors.Primary);
        StatsList[1] = new MockStat("Posted", posted.ToString("N0"), "\uE73E", ThemeColors.Success);
        StatsList[2] = new MockStat("IGST", igst.ToString("N0"), "\uE8A5", ThemeColors.Purple);
        StatsList[3] = new MockStat("Amount MTD", totalAmount.ToString("N2"), "\uE9D2", ThemeColors.Slate);
        OnPropertyChanged(nameof(Stats));
    }
}
