using System.Globalization;
using System.Text;
using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class ProcessPayrollViewModel : FormSubPageViewModel
{
    private readonly MainViewModel _host;

    public ProcessPayrollViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Payroll Processing",
        pageTitle: "Process Payroll",
        pageDescription: "Calculate salaries from attendance. If the month was already processed, you can replace the run (not if paid).",
        iconGlyph: "\uE8C8",
        fields:
        [
            new("Period (YYYY-MM) *", FormFieldKind.Text, DateTime.Today.ToString("yyyy-MM"), DateTime.Today.ToString("yyyy-MM")),
            new("Bonus %", FormFieldKind.Text, "Optional bonus on basic", "0"),
            new("Remark", FormFieldKind.Text, "Optional note")
        ])
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(ProcessAsync);
        PageTitle = "Process Payroll";
    }

    private async Task ProcessAsync()
    {
        var period = GetFieldValue("Period (YYYY-MM) *").Trim();
        if (!System.Text.RegularExpressions.Regex.IsMatch(period, @"^\d{4}-\d{2}$"))
        {
            MessageBox.Show("Period must be YYYY-MM (e.g. 2026-06).", "Payroll", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        decimal.TryParse(GetFieldValue("Bonus %"), NumberStyles.Any, CultureInfo.InvariantCulture, out var bonusPct);

        if (MessageBox.Show(
                $"Process payroll for {period}?\n\nEnsure attendance is entered for all employees.",
                "Confirm Payroll",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question) != MessageBoxResult.Yes)
            return;

        var reprocess = false;
        PayrollRunDto? existingRun = null;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var runs = await ImsApiClient.GetPayrollRunsAsync(period);
            existingRun = runs.FirstOrDefault(r =>
                !string.Equals(r.Status, "cancelled", StringComparison.OrdinalIgnoreCase));
        }, "Process Payroll");

        if (existingRun is not null)
        {
            if (string.Equals(existingRun.Status, "paid", StringComparison.OrdinalIgnoreCase))
            {
                MessageBox.Show(
                    $"Payroll for {period} is already paid (run #{existingRun.RunNo}).\n\nOpen Payroll Processing to view vouchers, or use Payroll Reports for payslips.",
                    "Process Payroll",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information);
                return;
            }

            if (MessageBox.Show(
                    $"Payroll for {period} already exists (run #{existingRun.RunNo}, status: {existingRun.Status}).\n\nReplace it with a new calculation from current attendance?",
                    "Reprocess Payroll",
                    MessageBoxButton.YesNo,
                    MessageBoxImage.Question) != MessageBoxResult.Yes)
                return;

            reprocess = true;
        }

        PayrollRunDto? run = null;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            run = await ImsApiClient.ProcessPayrollAsync(new ProcessPayrollRequestDto
            {
                PeriodMonth = period,
                BonusPercent = bonusPct,
                ProcessedBy = AuthSession.DisplayName,
                Remark = GetFieldValue("Remark"),
                Reprocess = reprocess
            });
        }, "Process Payroll");

        if (run is null)
            return;

        var sb = new StringBuilder();
        sb.AppendLine($"Payroll run #{run.RunNo} processed for {run.PeriodMonth}");
        sb.AppendLine($"Employees: {run.EmployeeCount}");
        sb.AppendLine($"Gross: {run.TotalGross:N2}  Deductions: {run.TotalDeductions:N2}");
        sb.AppendLine($"Net pay: {run.TotalNet:N2}  TDS: {run.TotalTds:N2}");
        sb.AppendLine();
        sb.AppendLine("By employee type:");
        foreach (var line in run.Lines.Take(15))
        {
            var typeLabel = !string.IsNullOrWhiteSpace(line.EmployeeTypeLabel)
                ? line.EmployeeTypeLabel
                : PayrollEmployeeFormFields.ToDisplayEmployeeType(line.EmployeeType);
            sb.AppendLine($"  {line.EmployeeCode} [{typeLabel}]: gross {line.Earnings?.Gross:N2} net {line.NetPay:N2}");
        }

        if (run.Lines.Count > 15)
            sb.AppendLine($"  … and {run.Lines.Count - 15} more");

        sb.AppendLine();
        sb.AppendLine("Next: open this run in Payroll Processing to post payment/receipt vouchers.");
        sb.AppendLine("Then Payroll Reports → Payslip to print salary slips.");

        MessageBox.Show(sb.ToString(), "Payroll Processed", MessageBoxButton.OK, MessageBoxImage.Information);
        _host.GoBack();
    }

    private string GetFieldValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.Value.Trim() ?? string.Empty;
}
