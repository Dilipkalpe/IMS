using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

public static class AuthSession
{
    public static string? Token { get; private set; }
    public static DateTime? ExpiresAt { get; private set; }
    public static AuthUserDto? User { get; private set; }
    public static AuthCompanyDto? Company { get; private set; }
    public static FinancialYearDto? FinancialYear { get; private set; }
    public static SoftwareLicenseStatusDto? License { get; private set; }

    public static bool IsAuthenticated => !string.IsNullOrWhiteSpace(Token);

    public static string DisplayName => User?.FullName ?? "User";
    public static string RoleLabel => User?.Role ?? string.Empty;
    public static string CompanyName => Company?.BusinessName ?? "IMS ERP";
    public static string FinancialYearName => FinancialYear?.FinancialYearName ?? string.Empty;

    public static bool IsAdministrator =>
        string.Equals(User?.Role, "Administrator", StringComparison.OrdinalIgnoreCase);

    /// <summary>Users who may open and maintain product BOMs.</summary>
    public static bool CanManageBom =>
        IsAuthenticated && User?.Role is { } role &&
        (IsAdministrator ||
         role.Equals("Manager", StringComparison.OrdinalIgnoreCase) ||
         role.Equals("Store", StringComparison.OrdinalIgnoreCase));

    /// <summary>Users who may print barcode labels from purchase invoices.</summary>
    public static bool CanPrintBarcodeLabels =>
        IsAuthenticated &&
        (IsAdministrator || User?.CanPrintBarcodeLabels == true);

    public static void Set(LoginResponseDto response)
    {
        Token = response.Token;
        User = response.User;
        Company = response.Company;
        FinancialYear = response.FinancialYear;
        License = response.License;
        ExpiresAt = DateTime.TryParse(response.ExpiresAt, out var exp) ? exp : null;
        MenuPermissionSession.Set(response.Permissions);
        ImsApiClient.ApplyAuthToken(Token);
    }

    public static void RestoreToApiClient()
    {
        if (IsAuthenticated)
            ImsApiClient.ApplyAuthToken(Token);
    }

    public static void Clear()
    {
        Token = null;
        User = null;
        Company = null;
        FinancialYear = null;
        License = null;
        ExpiresAt = null;
        MenuPermissionSession.Clear();
        ImsApiClient.ApplyAuthToken(null);
        GridColumnPreferenceService.ClearCache();
    }
}
