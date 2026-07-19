using System.Globalization;
using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class PayslipReportViewModel : FormSubPageViewModel
{
    private readonly MainViewModel _host;

    public PayslipReportViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Payroll Reports",
        pageTitle: "Payslip",
        pageDescription: "Generate and print salary slip. Browse to select employee (after payroll is processed).",
        iconGlyph: "\uE8A5",
        fields:
        [
            new("Period (YYYY-MM) *", FormFieldKind.Text, DateTime.Today.ToString("yyyy-MM"), DateTime.Today.ToString("yyyy-MM")),
            PayrollEmployeeFormFields.Code(),
            PayrollEmployeeFormFields.Name(),
            new("Run No (optional)", FormFieldKind.Text, "Leave blank for latest run", "")
        ])
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(ViewAndPrintAsync);
        PageTitle = "Payslip — View & Print";
    }

    private async Task ViewAndPrintAsync()
    {
        var period = GetFieldValue("Period (YYYY-MM) *").Trim();
        if (!System.Text.RegularExpressions.Regex.IsMatch(period, @"^\d{4}-\d{2}$"))
        {
            MessageBox.Show("Enter period as YYYY-MM.", "Payslip", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var code = GetFieldValue(PayrollEmployeeFormFields.CodeLabel);
        if (string.IsNullOrWhiteSpace(code))
        {
            MessageBox.Show("Select an employee using Browse.", "Payslip", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        int? runNo = null;
        var runText = GetFieldValue("Run No (optional)");
        if (!string.IsNullOrWhiteSpace(runText) && int.TryParse(runText, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n))
            runNo = n;

        PayslipReportDto? report = null;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            report = await ImsApiClient.GetPayslipByPeriodAsync(period, code, runNo);
        }, "Payslip");

        if (report?.Payslip is null)
            return;

        var choice = MessageBox.Show(
            "Payslip loaded.\n\nYes = Print preview\nNo = Open HTML in browser\nCancel = Close",
            "Payslip",
            MessageBoxButton.YesNoCancel,
            MessageBoxImage.Question);

        if (choice == MessageBoxResult.Yes)
            PayrollPayslipPrintService.ShowPreview(report);
        else if (choice == MessageBoxResult.No)
        {
            try
            {
                await PayrollPayslipPrintService.OpenHtmlInBrowserAsync(period, code, report.RunNo);
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Payslip HTML", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }
    }

    private string GetFieldValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.Value.Trim() ?? string.Empty;
}
