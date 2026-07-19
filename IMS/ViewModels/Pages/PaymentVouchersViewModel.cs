using System.Globalization;
using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class PaymentVouchersViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public PaymentVouchersViewModel(MainViewModel host) : base(
        "Payment Voucher",
        "Outgoing payment vouchers — cash and bank payments.",
        "\uE8C8",
        "Voucher No", "Party", "Amount", "Tran Date",
        [
            new("Total", "0", "\uE8C8", ThemeColors.Primary),
            new("Posted", "0", "\uE73E", ThemeColors.Success),
            new("Cash", "0", "\uE8C4", ThemeColors.Teal),
            new("Amount MTD", "0", "\uE8A5", ThemeColors.Slate)
        ],
        [],
        enableDelete: true,
        expandRows: false)
    {
        _host = host;
        EditRowCommand = CreateEditRowCommand(EditRow);
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add Payment Voucher", "\uE710", () => new PaymentVoucherEntryViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshPaymentVouchers(this);

    protected override void OnRowDeleted(MockRow row)
    {
        if (!int.TryParse(row.Col1, NumberStyles.Integer, CultureInfo.InvariantCulture, out var voucherNo))
            return;

        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeletePaymentVoucherByNoAsync(voucherNo);
            ApiListLoader.RefreshPaymentVouchers(this);
        });
        MessageBox.Show(
            $"Payment voucher #{row.Col1} was deleted.",
            "Payment Voucher Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        if (!int.TryParse(row.Col1, NumberStyles.Integer, CultureInfo.InvariantCulture, out var voucherNo))
            return;

        _host.NavigateToSubPage(new PaymentVoucherEntryViewModel(_host, voucherNo));
    }

    public void RefreshStats(IReadOnlyList<PaymentVoucherDto> items)
    {
        if (StatsList.Count < 4)
            return;

        var posted = items.Count(i => string.Equals(i.Status, "Posted", StringComparison.OrdinalIgnoreCase));
        var cash = items.Count(i => string.Equals(i.CashBank, "CASH", StringComparison.OrdinalIgnoreCase));
        var totalAmount = items.Sum(i => i.Amount);

        StatsList[0] = new MockStat("Total", items.Count.ToString("N0"), "\uE8C8", ThemeColors.Primary);
        StatsList[1] = new MockStat("Posted", posted.ToString("N0"), "\uE73E", ThemeColors.Success);
        StatsList[2] = new MockStat("Cash", cash.ToString("N0"), "\uE8C4", ThemeColors.Teal);
        StatsList[3] = new MockStat("Amount MTD", totalAmount.ToString("N2"), "\uE8A5", ThemeColors.Slate);
        OnPropertyChanged(nameof(Stats));
    }
}
