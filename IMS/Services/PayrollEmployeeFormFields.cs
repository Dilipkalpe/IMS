using System.Globalization;
using IMS.Models;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

public static class PayrollEmployeeFormFields
{
    public const string CodeLabel = "Employee Code *";
    public const string NameLabel = "Employee Name";
    public const string EmployeeTypeLabel = "Employee Type *";
    public const string DepartmentLabel = "Department";
    public const string DesignationLabel = "Designation";
    public const string PanLabel = "PAN";
    public const string PayableAccountLabel = "Payable Account Code";
    public const string MonthlySalaryLabel = "Monthly Salary";
    public const string DailyWageLabel = "Daily Wage Rate";
    public const string ContractStartLabel = "Contract Start Date";
    public const string ContractEndLabel = "Contract End Date";
    public const string HraPercentLabel = "HRA %";
    public const string BonusPercentLabel = "Bonus %";
    public const string TdsPercentLabel = "TDS %";
    public const string StatusLabel = "Status";

    public static readonly string[] EmployeeTypeOptions = ["Permanent", "Temporary", "Daily Wage"];

    public static FormFieldViewModel Code(string placeholder = "Browse to select employee") =>
        new(CodeLabel, FormFieldKind.Text, placeholder, hasBrowseButton: true);

    public static FormFieldViewModel Name(string placeholder = "Filled when you browse") =>
        new(NameLabel, FormFieldKind.Text, placeholder, isReadOnly: true);

    public static bool IsEmployeeCodeField(FormFieldViewModel field) =>
        string.Equals(field.Label, CodeLabel, StringComparison.Ordinal);

    public static void ApplySelection(IEnumerable<FormFieldViewModel> fields, MasterPickRow selected)
    {
        SetValue(fields, CodeLabel, selected.Code);
        SetValue(fields, NameLabel, selected.Name);
    }

    public static void SetValue(IEnumerable<FormFieldViewModel> fields, string label, string value)
    {
        var field = fields.FirstOrDefault(f => string.Equals(f.Label, label, StringComparison.Ordinal));
        if (field is null)
            return;

        if (field.Kind == FormFieldKind.Combo)
            field.SelectedOption = value;
        else
            field.Value = value;
    }

    public static string ToApiEmployeeType(string? displayOption) =>
        displayOption?.Trim() switch
        {
            "Temporary" => "temporary",
            "Daily Wage" => "daily",
            _ => "permanent"
        };

    public static string ToDisplayEmployeeType(string? apiType) =>
        apiType?.Trim().ToLowerInvariant() switch
        {
            "temporary" => "Temporary",
            "daily" => "Daily Wage",
            _ => "Permanent"
        };

    public static string? ValidateForm(
        string employeeTypeDisplay,
        string monthlySalaryText,
        string dailyWageText,
        DateTime? contractStart,
        DateTime? contractEnd)
    {
        var apiType = ToApiEmployeeType(employeeTypeDisplay);
        decimal Parse(string text) =>
            decimal.TryParse(text, NumberStyles.Any, CultureInfo.InvariantCulture, out var v) ? v : 0;

        if (apiType is "permanent" or "temporary")
        {
            if (Parse(monthlySalaryText) <= 0)
                return "Monthly salary is required for permanent and temporary employees.";
        }

        if (apiType == "temporary")
        {
            if (contractStart is null || contractEnd is null)
                return "Contract start and end dates are required for temporary employees.";
            if (contractEnd.Value.Date < contractStart.Value.Date)
                return "Contract end date must be on or after the start date.";
        }

        if (apiType == "daily" && Parse(dailyWageText) <= 0)
            return "Daily wage rate is required for daily wage employees.";

        return null;
    }

    public static string FormatCompensation(PayrollEmployeeDto item)
    {
        var apiType = ToApiEmployeeType(ToDisplayEmployeeType(item.EmployeeType));
        if (apiType == "daily")
            return $"{item.DailyWage.ToString("N0", CultureInfo.InvariantCulture)}/day";

        var monthly = item.MonthlySalary > 0 ? item.MonthlySalary : item.BasicSalary;
        return monthly.ToString("N0", CultureInfo.InvariantCulture);
    }

}
