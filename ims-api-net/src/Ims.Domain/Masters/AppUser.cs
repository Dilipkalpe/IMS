using Ims.Domain.Common;

namespace Ims.Domain.Masters;

public sealed class AppUser : EntityBase, IYearScoped
{
    public string YearDatabaseName { get; set; } = string.Empty;

    public string EmployeeId { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string? RoleId { get; set; }

    public string? Department { get; set; }

    public string? Email { get; set; }

    public bool ActiveStatus { get; set; } = true;

    public bool CanPrintBarcodeLabels { get; set; }
}
