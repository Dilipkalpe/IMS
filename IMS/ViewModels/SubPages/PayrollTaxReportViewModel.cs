using System.Globalization;
using System.Text;
using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public sealed class PayrollTaxReportViewModel : FormSubPageViewModel
{
    public PayrollTaxReportViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Payroll Reports",
        pageTitle: "Tax Summary",
        pageDescription: "Monthly TDS, PF, ESI, and net pay summary.",
        iconGlyph: "\uE8C0",
        fields:
        [
            new("Period (YYYY-MM) *", FormFieldKind.Text, DateTime.Today.ToString("yyyy-MM"), DateTime.Today.ToString("yyyy-MM"))
        ])
    {
        SaveCommand = new AsyncRelayCommand(RunAsync);
        PageTitle = "Tax Summary Report";
    }

    private async Task RunAsync()
    {
        var period = GetFieldValue("Period (YYYY-MM) *").Trim();
        if (!System.Text.RegularExpressions.Regex.IsMatch(period, @"^\d{4}-\d{2}$"))
        {
            MessageBox.Show("Period must be YYYY-MM.", "Tax Report", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var report = await ImsApiClient.GetPayrollTaxSummaryAsync(period);
            if (report is null)
            {
                MessageBox.Show("No payroll run found for this period.", "Tax Report", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            var sb = new StringBuilder();
            sb.AppendLine($"Tax & statutory — {report.PeriodMonth} (Run #{report.RunNo})");
            sb.AppendLine($"Gross: {report.Totals?.Gross:N2}  TDS: {report.Totals?.Tds:N2}");
            sb.AppendLine($"PF: {report.Totals?.Pf:N2}  ESI: {report.Totals?.Esi:N2}  Net: {report.Totals?.Net:N2}");
            sb.AppendLine();
            foreach (var e in report.Employees.Take(20))
            {
                var typeLabel = !string.IsNullOrWhiteSpace(e.EmployeeTypeLabel)
                    ? e.EmployeeTypeLabel
                    : PayrollEmployeeFormFields.ToDisplayEmployeeType(e.EmployeeType);
                sb.AppendLine($"{e.EmployeeCode} {e.EmployeeName} [{typeLabel}]: Gross {e.Gross:N2} TDS {e.Tds:N2} Net {e.NetPay:N2}");
            }
            MessageBox.Show(sb.ToString(), "Tax Report", MessageBoxButton.OK, MessageBoxImage.Information);
        }, "Tax Report");
    }

    private string GetFieldValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.Value.Trim() ?? string.Empty;
}
