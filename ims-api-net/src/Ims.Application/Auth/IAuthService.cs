namespace Ims.Application.Auth;

public sealed record AuthUserDto(
    string Id,
    string Username,
    string EmployeeId,
    string FullName,
    string Role,
    string? RoleId,
    string Department,
    string Email,
    bool CanPrintBarcodeLabels);

public sealed record MenuPermissionDto(
    string MenuKey,
    bool CanView,
    bool CanAdd,
    bool CanEdit,
    bool CanDelete,
    bool CanExport);

public sealed record CompanySummaryDto(string Code, string BusinessName, string Tagline);

public sealed record FinancialYearSummaryDto(
    string Id,
    string FinancialYearName,
    DateTime StartDate,
    DateTime EndDate,
    string DatabaseName,
    bool IsActive,
    bool Closed);

public sealed record LicenseStatusDto(
    string LicenseType,
    bool IsExpired,
    DateTime? ExpiresAt,
    int? DaysRemaining);

public sealed record LoginResultDto(
    string Token,
    string ExpiresAt,
    AuthUserDto User,
    IReadOnlyList<MenuPermissionDto> Permissions,
    CompanySummaryDto Company,
    LicenseStatusDto License,
    FinancialYearSummaryDto FinancialYear);

public interface IAuthService
{
    Task<(bool Ok, int Status, string? Error, LoginResultDto? Result)> LoginAsync(
        string loginId,
        string password,
        string financialYearId,
        CancellationToken cancellationToken = default);

    Task<(bool Ok, AuthUserDto? User, IReadOnlyList<MenuPermissionDto> Permissions)> GetMeAsync(
        string token,
        CancellationToken cancellationToken = default);

    (string Token, DateTime ExpiresAt) SignToken(string userId, string username, string role, string yearDb);

    bool TryVerifyToken(string token, out TokenPayload? payload);
}

public sealed record TokenPayload(
    string Sub,
    string Username,
    string Role,
    string YearDb,
    long Exp);
