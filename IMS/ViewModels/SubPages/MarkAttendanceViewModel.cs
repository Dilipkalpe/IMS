using System.Globalization;
using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class MarkAttendanceViewModel : FormSubPageViewModel
{
    private readonly MainViewModel _host;

    public MarkAttendanceViewModel(MainViewModel host, string periodMonth) : base(
        host,
        parentTitle: "Attendance",
        pageTitle: "Mark Attendance",
        pageDescription: $"Record attendance for period {periodMonth}. Use Browse to select employee.",
        iconGlyph: "\uE710",
        fields:
        [
            PayrollEmployeeFormFields.Code(),
            PayrollEmployeeFormFields.Name(),
            new("Date *", FormFieldKind.Date, defaultValue: DateTime.Today.ToString("yyyy-MM-dd")),
            new("Status", FormFieldKind.Combo, options: ["present", "absent", "leave", "holiday", "half_day"], defaultValue: "present"),
            new("Worked Hours", FormFieldKind.Text, "8", "8"),
            new("OT Hours", FormFieldKind.Text, "0", "0"),
            new("Remark", FormFieldKind.Text, "Optional")
        ])
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    private async Task SaveAsync()
    {
        var code = GetFieldValue(PayrollEmployeeFormFields.CodeLabel);
        if (string.IsNullOrWhiteSpace(code))
        {
            MessageBox.Show("Select an employee using Browse.", "Attendance", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!DateTime.TryParse(GetFieldValue("Date *"), CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            MessageBox.Show("Enter a valid date.", "Attendance", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var name = GetFieldValue(PayrollEmployeeFormFields.NameLabel);
        if (string.IsNullOrWhiteSpace(name) && ImsApiClient.IsAvailable)
        {
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var emp = await ImsApiClient.GetPayrollEmployeeByCodeAsync(code);
                if (emp is not null)
                    name = emp.FullName;
            });
        }

        var dto = ApiDocumentMapper.FromAttendanceForm(
            code,
            name,
            date,
            GetComboValue("Status"),
            GetFieldValue("Worked Hours"),
            GetFieldValue("OT Hours"));

        var ok = false;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            await ImsApiClient.CreateAttendanceAsync(dto);
            ok = true;
        }, "Save Attendance");

        if (!ok)
            return;

        MessageBox.Show("Attendance saved.", "Attendance", MessageBoxButton.OK, MessageBoxImage.Information);
        _host.GoBack();
    }

    private string GetFieldValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.Value.Trim() ?? string.Empty;

    private string GetComboValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.SelectedOption ?? "present";
}
