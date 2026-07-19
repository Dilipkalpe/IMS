using System.Globalization;
using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class PayrollEmployeesViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public PayrollEmployeesViewModel(MainViewModel host) : base(
        "Payroll Employees",
        "Employee master for salary, tax, PF/ESI/PT, and attendance linkage.",
        "\uE716",
        "Code", "Name", "Type", "Salary / Wage",
        [
            new("Employees", "0", "\uE716", ThemeColors.Primary),
            new("Active", "0", "\uE73E", ThemeColors.Success),
            new("Departments", "0", "\uE8FD", ThemeColors.Slate),
            new("Avg Basic", "0", "\uE8C8", ThemeColors.Warning)
        ],
        [],
        enableDelete: true)
    {
        _host = host;
        EditRowCommand = CreateEditRowCommand(EditRow);
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add Employee", "\uE710", () => new AddPayrollEmployeeViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshPayrollEmployees(this);

    protected override async Task<bool> DeleteRowCoreAsync(MockRow row)
    {
        var deleted = false;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            await ImsApiClient.DeletePayrollEmployeeByCodeAsync(row.Col1);
            deleted = true;
        }, "Delete Employee");
        if (deleted)
            ApiListLoader.RefreshPayrollEmployees(this);
        return deleted;
    }

    protected override void OnRowDeleted(MockRow row) =>
        MessageBox.Show($"Employee {row.Col1} was deleted.", "Payroll", MessageBoxButton.OK, MessageBoxImage.Information);

    private void EditRow(MockRow row) =>
        _host.NavigateToSubPage(new AddPayrollEmployeeViewModel(_host, row));

    public void RefreshStats(IReadOnlyList<PayrollEmployeeDto> items)
    {
        if (StatsList.Count < 4)
            return;
        var active = items.Count(i => i.ActiveStatus);
        var depts = items.Select(i => i.Department).Where(d => !string.IsNullOrWhiteSpace(d)).Distinct().Count();
        var avgBasic = items.Count > 0 ? items.Average(i => (double)i.BasicSalary) : 0;
        StatsList[0] = new MockStat("Employees", items.Count.ToString("N0"), "\uE716", ThemeColors.Primary);
        StatsList[1] = new MockStat("Active", active.ToString("N0"), "\uE73E", ThemeColors.Success);
        StatsList[2] = new MockStat("Departments", depts.ToString("N0"), "\uE8FD", ThemeColors.Slate);
        StatsList[3] = new MockStat("Avg Basic", avgBasic.ToString("N0", CultureInfo.InvariantCulture), "\uE8C8", ThemeColors.Warning);
        OnPropertyChanged(nameof(Stats));
    }
}
