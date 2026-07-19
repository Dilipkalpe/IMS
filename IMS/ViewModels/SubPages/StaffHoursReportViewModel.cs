using System.Globalization;
using System.Text;
using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public sealed class StaffHoursReportViewModel : FormSubPageViewModel
{
    public StaffHoursReportViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Payroll Reports",
        pageTitle: "Staff Hours",
        pageDescription: "Worked hours and paid days from attendance.",
        iconGlyph: "\uE787",
        fields:
        [
            new("Period (YYYY-MM) *", FormFieldKind.Text, DateTime.Today.ToString("yyyy-MM"), DateTime.Today.ToString("yyyy-MM"))
        ])
    {
        SaveCommand = new AsyncRelayCommand(RunAsync);
        PageTitle = "Staff Hours Report";
    }

    private async Task RunAsync()
    {
        var period = GetFieldValue("Period (YYYY-MM) *").Trim();
        if (!System.Text.RegularExpressions.Regex.IsMatch(period, @"^\d{4}-\d{2}$"))
        {
            MessageBox.Show("Period must be YYYY-MM.", "Staff Hours", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var report = await ImsApiClient.GetStaffHoursReportAsync(period);
            if (report is null)
            {
                MessageBox.Show("Could not load staff hours.", "Staff Hours", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            var sb = new StringBuilder();
            sb.AppendLine($"Staff hours — {report.PeriodMonth}");
            foreach (var e in report.Employees.Take(25))
            {
                var typeLabel = !string.IsNullOrWhiteSpace(e.EmployeeTypeLabel)
                    ? e.EmployeeTypeLabel
                    : PayrollEmployeeFormFields.ToDisplayEmployeeType(e.EmployeeType);
                sb.AppendLine($"{e.EmployeeCode} {e.EmployeeName} [{typeLabel}]: paid days {e.PaidDays:N1}, hrs {e.WorkedHours:N1}, OT {e.OtHours:N1}");
            }
            MessageBox.Show(sb.ToString(), "Staff Hours Report", MessageBoxButton.OK, MessageBoxImage.Information);
        }, "Staff Hours");
    }

    private string GetFieldValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.Value.Trim() ?? string.Empty;
}
