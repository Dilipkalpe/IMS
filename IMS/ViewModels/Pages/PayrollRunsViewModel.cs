using System.Globalization;
using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class PayrollRunsViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public PayrollRunsViewModel(MainViewModel host) : base(
        "Payroll Processing",
        "Process payroll, then open a run to post payment/receipt vouchers to accounts and print payslips from Reports.",
        "\uE8C8",
        "Run No", "Period", "Net Pay", "Status",
        [
            new("Runs", "0", "\uE8C8", ThemeColors.Primary),
            new("Processed", "0", "\uE73E", ThemeColors.Success),
            new("Total Net", "0", "\uE8C7", ThemeColors.Warning),
            new("Total TDS", "0", "\uE9D2", ThemeColors.Slate)
        ],
        [],
        enableDelete: true)
    {
        _host = host;
        EditRowCommand = CreateEditRowCommand(EditRow);
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Process Payroll", "\uE710", () => new ProcessPayrollViewModel(host))
        ];
    }

    private void EditRow(MockRow row)
    {
        if (!int.TryParse(row.Col1, NumberStyles.Integer, CultureInfo.InvariantCulture, out var runNo))
            return;

        if (string.Equals(row.Status, "processed", StringComparison.OrdinalIgnoreCase))
        {
            _host.NavigateToSubPage(new PostPayrollPaymentViewModel(_host, runNo));
            return;
        }

        if (string.Equals(row.Status, "paid", StringComparison.OrdinalIgnoreCase))
        {
            MessageBox.Show(
                $"Payroll run #{runNo} is paid. Payment/receipt vouchers are in Finance → Payment Voucher / Receipt Voucher.\nUse Payroll Reports → Payslip to print slips.",
                "Payroll",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
        }
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshPayrollRuns(this);

    protected override async Task<bool> DeleteRowCoreAsync(MockRow row)
    {
        if (!int.TryParse(row.Col1, NumberStyles.Integer, CultureInfo.InvariantCulture, out var runNo))
            return false;
        if (string.Equals(row.Status, "paid", StringComparison.OrdinalIgnoreCase))
        {
            MessageBox.Show("Paid payroll runs cannot be deleted.", "Payroll", MessageBoxButton.OK, MessageBoxImage.Warning);
            return false;
        }
        if (MessageBox.Show($"Delete payroll run #{runNo}?", "Confirm", MessageBoxButton.YesNo, MessageBoxImage.Question) != MessageBoxResult.Yes)
            return false;

        var deleted = false;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            await ImsApiClient.DeletePayrollRunByNoAsync(runNo);
            deleted = true;
        }, "Delete Payroll Run");
        if (deleted)
            ApiListLoader.RefreshPayrollRuns(this);
        return deleted;
    }

    protected override void OnRowDeleted(MockRow row) =>
        MessageBox.Show($"Payroll run #{row.Col1} deleted.", "Payroll", MessageBoxButton.OK, MessageBoxImage.Information);

    public void RefreshStats(IReadOnlyList<PayrollRunDto> items)
    {
        if (StatsList.Count < 4)
            return;
        var processed = items.Count(i => i.Status is "processed" or "paid");
        StatsList[0] = new MockStat("Runs", items.Count.ToString("N0"), "\uE8C8", ThemeColors.Primary);
        StatsList[1] = new MockStat("Processed", processed.ToString("N0"), "\uE73E", ThemeColors.Success);
        StatsList[2] = new MockStat("Total Net", items.Sum(i => i.TotalNet).ToString("N0", CultureInfo.InvariantCulture), "\uE8C7", ThemeColors.Warning);
        StatsList[3] = new MockStat("Total TDS", items.Sum(i => i.TotalTds).ToString("N0", CultureInfo.InvariantCulture), "\uE9D2", ThemeColors.Slate);
        OnPropertyChanged(nameof(Stats));
    }
}
