using System.Windows;
using IMS.Models;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels;
using IMS.Views;

namespace IMS.Services;

public static class MasterPickService
{
    public static MasterPickRow? PickUser(Window? owner = null) =>
        Pick(
            new MasterPickViewModel(
                "Select operator",
                "Username",
                "Choose a user as production operator. Double-click a row or click Select.",
                LoadUsersPageAsync),
            owner);

    public static MasterPickRow? PickMachine(Window? owner = null) =>
        Pick(
            new MasterPickViewModel(
                "Select machine",
                "Machine code",
                "Choose a machine for this work order. Double-click a row or click Select.",
                LoadMachinesPageAsync),
            owner);

    public static MasterPickRow? PickPayrollEmployee(Window? owner = null) =>
        Pick(
            new MasterPickViewModel(
                "Select employee",
                "Employee code",
                "Choose a payroll employee. Double-click a row or click Select.",
                LoadPayrollEmployeesPageAsync),
            owner);

    private static MasterPickRow? Pick(MasterPickViewModel viewModel, Window? owner)
    {
        try
        {
            var window = new MasterPickWindow(viewModel)
            {
                Owner = owner ?? Application.Current?.MainWindow
            };

            return window.ShowDialog() == true ? viewModel.Result : null;
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Could not open picker: {ex.Message}",
                viewModel.Title,
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            return null;
        }
    }

    private static async Task<PagedResponse<MasterPickRow>> LoadUsersPageAsync(
        int page,
        int limit,
        string? search,
        CancellationToken cancellationToken)
    {
        if (!await ImsApiClient.CheckHealthAsync())
            return OfflineUsers(search);

        var response = await ImsApiClient.GetUsersPageAsync(page, limit, search, cancellationToken);
        return new PagedResponse<MasterPickRow>
        {
            Total = response.Total,
            Items = response.Items
                .Where(u => u.ActiveStatus)
                .Select(MapUser)
                .ToList()
        };
    }

    private static async Task<PagedResponse<MasterPickRow>> LoadMachinesPageAsync(
        int page,
        int limit,
        string? search,
        CancellationToken cancellationToken)
    {
        if (!await ImsApiClient.CheckHealthAsync())
            return OfflineMachines(search);

        var response = await ImsApiClient.GetMachinesPageAsync(page, limit, search, cancellationToken);
        return new PagedResponse<MasterPickRow>
        {
            Total = response.Total,
            Items = response.Items.Select(MapMachine).ToList()
        };
    }

    private static async Task<PagedResponse<MasterPickRow>> LoadPayrollEmployeesPageAsync(
        int page,
        int limit,
        string? search,
        CancellationToken cancellationToken)
    {
        if (!await ImsApiClient.CheckHealthAsync())
            return OfflinePayrollEmployees(search);

        var response = await ImsApiClient.GetPayrollEmployeesPageAsync(page, limit, search, activeOnly: true, cancellationToken);
        return new PagedResponse<MasterPickRow>
        {
            Total = response.Total,
            Items = response.Items.Select(MapPayrollEmployee).ToList()
        };
    }

    private static MasterPickRow MapUser(AppUserDto user) =>
        new()
        {
            Code = user.Username,
            Name = user.FullName,
            Detail = string.Join(" — ", new[] { user.Role, user.Department }.Where(s => !string.IsNullOrWhiteSpace(s)))
        };

    private static MasterPickRow MapMachine(MachineDto machine) =>
        new()
        {
            Code = machine.Code,
            Name = machine.Name,
            Detail = machine.Description
        };

    private static MasterPickRow MapPayrollEmployee(PayrollEmployeeDto employee) =>
        new()
        {
            Code = employee.EmployeeCode,
            Name = employee.FullName,
            Detail = string.Join(" — ", new[] { employee.Department, employee.Designation }
                .Where(s => !string.IsNullOrWhiteSpace(s)))
        };

    private static PagedResponse<MasterPickRow> OfflineUsers(string? search)
    {
        var all = new[]
        {
            new MasterPickRow { Code = "admin", Name = "System Administrator", Detail = "Administrator" },
            new MasterPickRow { Code = "jsmith", Name = "John Smith", Detail = "Manager — Sales" },
            new MasterPickRow { Code = "astore", Name = "Store Keeper", Detail = "Store — Inventory" }
        };

        return FilterOffline(all, search);
    }

    private static PagedResponse<MasterPickRow> OfflineMachines(string? search)
    {
        var all = new[]
        {
            new MasterPickRow { Code = "MCH-001", Name = "CNC Lathe #1", Detail = "Production floor" },
            new MasterPickRow { Code = "MCH-002", Name = "Hydraulic Press", Detail = "Assembly bay" },
            new MasterPickRow { Code = "MCH-003", Name = "Assembly Line A", Detail = "Final assembly" }
        };

        return FilterOffline(all, search);
    }

    private static PagedResponse<MasterPickRow> OfflinePayrollEmployees(string? search)
    {
        var all = new[]
        {
            new MasterPickRow { Code = "EMP-1001", Name = "Ravi Kumar", Detail = "Production — Operator" },
            new MasterPickRow { Code = "EMP-1002", Name = "Priya Sharma", Detail = "Accounts — Accountant" },
            new MasterPickRow { Code = "EMP-1003", Name = "Amit Patel", Detail = "Store — Store Keeper" }
        };

        return FilterOffline(all, search);
    }

    private static PagedResponse<MasterPickRow> FilterOffline(IEnumerable<MasterPickRow> rows, string? search)
    {
        var term = search?.Trim();
        var filtered = string.IsNullOrWhiteSpace(term)
            ? rows.ToList()
            : rows.Where(r =>
                r.Code.Contains(term, StringComparison.OrdinalIgnoreCase)
                || r.Name.Contains(term, StringComparison.OrdinalIgnoreCase)
                || (r.Detail?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)).ToList();

        return new PagedResponse<MasterPickRow>
        {
            Items = filtered,
            Total = filtered.Count
        };
    }
}
