using System.Collections.ObjectModel;
using System.Globalization;
using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class AddPayrollEmployeeViewModel : SubPageViewModelBase
{
    private readonly bool _isEdit;
    private readonly string _originalCode = string.Empty;

    private string _employeeCode = string.Empty;
    private string _fullName = string.Empty;
    private string _selectedEmployeeType = "Permanent";
    private string _department = string.Empty;
    private string _designation = string.Empty;
    private string _panNo = string.Empty;
    private string _payableAccountCode = "PAY-EMP-1001";
    private string _monthlySalaryText = "25000";
    private string _dailyWageText = "0";
    private DateTime? _contractStartDate;
    private DateTime? _contractEndDate;
    private string _hraPercentText = "40";
    private string _bonusPercentText = "0";
    private string _tdsPercentText = "0";
    private string _selectedStatus = "Active";

    public AddPayrollEmployeeViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Payroll Employees",
        pageTitle: "Add Employee",
        pageDescription: "Create payroll employee with employee type, salary structure, and statutory settings.",
        iconGlyph: "\uE710")
    {
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    public AddPayrollEmployeeViewModel(MainViewModel host, MockRow existing) : base(
        host,
        parentTitle: "Payroll Employees",
        pageTitle: "Edit Employee",
        pageDescription: "Update payroll employee profile, employee type, and compensation.",
        iconGlyph: "\uE70F")
    {
        _isEdit = true;
        _originalCode = existing.Col1;
        EmployeeCode = existing.Col1;
        FullName = existing.Col2;
        Department = existing.Col3 == "—" ? "" : existing.Col3;
        MonthlySalaryText = existing.Col4;
        SelectedStatus = existing.Status ?? "Active";
        PayableAccountCode = $"PAY-{existing.Col1}";
        SaveCommand = new AsyncRelayCommand(SaveAsync);
        _ = LoadDetailAsync(existing.Col1);
    }

    public ObservableCollection<string> EmployeeTypeOptions { get; } =
        new(PayrollEmployeeFormFields.EmployeeTypeOptions);

    public ObservableCollection<string> StatusOptions { get; } = ["Active", "Inactive"];

    public bool IsEmployeeCodeReadOnly => _isEdit;

    public string EmployeeCode
    {
        get => _employeeCode;
        set => SetProperty(ref _employeeCode, value?.Trim().ToUpperInvariant() ?? string.Empty);
    }

    public string FullName
    {
        get => _fullName;
        set => SetProperty(ref _fullName, value ?? string.Empty);
    }

    public string SelectedEmployeeType
    {
        get => _selectedEmployeeType;
        set
        {
            if (!SetProperty(ref _selectedEmployeeType, value))
                return;

            OnPropertyChanged(nameof(ShowMonthlySalary));
            OnPropertyChanged(nameof(ShowDailyWage));
            OnPropertyChanged(nameof(ShowContractDates));
            OnPropertyChanged(nameof(ShowHraBonus));
        }
    }

    public string Department
    {
        get => _department;
        set => SetProperty(ref _department, value ?? string.Empty);
    }

    public string Designation
    {
        get => _designation;
        set => SetProperty(ref _designation, value ?? string.Empty);
    }

    public string PanNo
    {
        get => _panNo;
        set => SetProperty(ref _panNo, value?.Trim().ToUpperInvariant() ?? string.Empty);
    }

    public string PayableAccountCode
    {
        get => _payableAccountCode;
        set => SetProperty(ref _payableAccountCode, value?.Trim().ToUpperInvariant() ?? string.Empty);
    }

    public string MonthlySalaryText
    {
        get => _monthlySalaryText;
        set => SetProperty(ref _monthlySalaryText, value ?? string.Empty);
    }

    public string DailyWageText
    {
        get => _dailyWageText;
        set => SetProperty(ref _dailyWageText, value ?? string.Empty);
    }

    public DateTime? ContractStartDate
    {
        get => _contractStartDate;
        set => SetProperty(ref _contractStartDate, value);
    }

    public DateTime? ContractEndDate
    {
        get => _contractEndDate;
        set => SetProperty(ref _contractEndDate, value);
    }

    public string HraPercentText
    {
        get => _hraPercentText;
        set => SetProperty(ref _hraPercentText, value ?? string.Empty);
    }

    public string BonusPercentText
    {
        get => _bonusPercentText;
        set => SetProperty(ref _bonusPercentText, value ?? string.Empty);
    }

    public string TdsPercentText
    {
        get => _tdsPercentText;
        set => SetProperty(ref _tdsPercentText, value ?? string.Empty);
    }

    public string SelectedStatus
    {
        get => _selectedStatus;
        set => SetProperty(ref _selectedStatus, value ?? "Active");
    }

    public bool ShowMonthlySalary =>
        PayrollEmployeeFormFields.ToApiEmployeeType(SelectedEmployeeType) is "permanent" or "temporary";

    public bool ShowDailyWage =>
        PayrollEmployeeFormFields.ToApiEmployeeType(SelectedEmployeeType) == "daily";

    public bool ShowContractDates =>
        PayrollEmployeeFormFields.ToApiEmployeeType(SelectedEmployeeType) == "temporary";

    public bool ShowHraBonus => !ShowDailyWage;

    private async Task LoadDetailAsync(string code)
    {
        if (!ImsApiClient.IsAvailable)
            return;

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var dto = await ImsApiClient.GetPayrollEmployeeByCodeAsync(code);
            if (dto is null)
                return;

            ApplyDto(dto);
        });
    }

    private void ApplyDto(PayrollEmployeeDto dto)
    {
        EmployeeCode = dto.EmployeeCode;
        FullName = dto.FullName;
        SelectedEmployeeType = PayrollEmployeeFormFields.ToDisplayEmployeeType(dto.EmployeeType);
        Department = dto.Department ?? string.Empty;
        Designation = dto.Designation ?? string.Empty;
        PanNo = dto.PanNo ?? string.Empty;
        PayableAccountCode = dto.PayableAccountCode ?? $"PAY-{dto.EmployeeCode}";
        var monthly = dto.MonthlySalary > 0 ? dto.MonthlySalary : dto.BasicSalary;
        MonthlySalaryText = monthly.ToString("0.##", CultureInfo.InvariantCulture);
        DailyWageText = dto.DailyWage.ToString("0.##", CultureInfo.InvariantCulture);
        ContractStartDate = dto.ContractStartDate?.Date;
        ContractEndDate = dto.ContractEndDate?.Date;
        HraPercentText = dto.HraPercent.ToString("0.##", CultureInfo.InvariantCulture);
        BonusPercentText = dto.BonusPercent.ToString("0.##", CultureInfo.InvariantCulture);
        TdsPercentText = dto.TdsPercent.ToString("0.##", CultureInfo.InvariantCulture);
        SelectedStatus = dto.ActiveStatus ? "Active" : "Inactive";
    }

    private async Task SaveAsync()
    {
        if (string.IsNullOrWhiteSpace(EmployeeCode) || string.IsNullOrWhiteSpace(FullName))
        {
            MessageBox.Show("Employee code and name are required.", "Payroll", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var validationError = PayrollEmployeeFormFields.ValidateForm(
            SelectedEmployeeType,
            MonthlySalaryText,
            DailyWageText,
            ContractStartDate,
            ContractEndDate);

        if (validationError is not null)
        {
            MessageBox.Show(validationError, "Payroll", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var dto = ApiDocumentMapper.FromPayrollEmployeeForm(
            EmployeeCode,
            FullName,
            SelectedEmployeeType,
            Department,
            Designation,
            PanNo,
            PayableAccountCode,
            MonthlySalaryText,
            DailyWageText,
            FormatContractDate(ContractStartDate),
            FormatContractDate(ContractEndDate),
            HraPercentText,
            BonusPercentText,
            TdsPercentText,
            !string.Equals(SelectedStatus, "Inactive", StringComparison.OrdinalIgnoreCase));

        var ok = false;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            if (_isEdit)
                await ImsApiClient.UpdatePayrollEmployeeByCodeAsync(_originalCode, dto);
            else
                await ImsApiClient.CreatePayrollEmployeeAsync(dto);
            ok = true;
        }, "Save Employee");

        if (!ok)
            return;

        MessageBox.Show($"Employee {dto.EmployeeCode} saved.", "Payroll", MessageBoxButton.OK, MessageBoxImage.Information);
        Host.GoBack();
    }

    private static string FormatContractDate(DateTime? value) =>
        value?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? string.Empty;
}
