using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Ims.Application.Auth;
using Ims.Domain.Config;
using Ims.Domain.Masters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Ims.Infrastructure.Auth;

public sealed class AuthService : IAuthService
{
    private const int SaltLen = 16;
    private const int KeyLen = 64;
    private const int Iterations = 100_000;
    private static readonly TimeSpan TokenTtl = TimeSpan.FromHours(8);

    private readonly ImsDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthService(ImsDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    private string Secret =>
        _configuration["IMS_AUTH_SECRET"] ?? "ims-dev-auth-secret-change-in-production";

    public async Task<(bool Ok, int Status, string? Error, LoginResultDto? Result)> LoginAsync(
        string loginId,
        string password,
        string financialYearId,
        CancellationToken cancellationToken = default)
    {
        var fyId = financialYearId.Trim();
        if (string.IsNullOrEmpty(fyId))
            return (false, 400, "Financial year is required.", null);

        var fy = await _db.FinancialYears.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == fyId, cancellationToken);
        if (fy is null || !fy.IsActive)
            return (false, 400, "Invalid or inactive financial year.", null);

        var id = loginId.Trim();
        if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(password))
            return (false, 400, "Employee ID / email and password are required.", null);

        var user = await _db.AppUsers
            .FirstOrDefaultAsync(u =>
                u.YearDatabaseName == fy.DatabaseName &&
                (EF.Functions.ILike(u.Username, id) ||
                 EF.Functions.ILike(u.Email ?? "", id) ||
                 EF.Functions.ILike(u.EmployeeId, id)),
                cancellationToken);

        if (user is null)
            return (false, 401, "Invalid credentials. Check your login ID and password.", null);

        if (!user.ActiveStatus)
            return (false, 403, "This account is inactive. Contact your administrator.", null);

        if (!VerifyPassword(password, user.PasswordHash))
            return (false, 401, "Invalid credentials. Check your login ID and password.", null);

        var license = await GetLicenseStatusAsync(cancellationToken);
        if (license.IsExpired && !IsAdministratorRole(user.Role))
        {
            return (false, 403, "Software license has expired. Contact your administrator to extend the license.", null);
        }

        var company = await _db.Companies.AsNoTracking()
            .Where(c => c.YearDatabaseName == fy.DatabaseName && c.ActiveStatus)
            .OrderByDescending(c => c.IsDefault)
            .ThenBy(c => c.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        var (token, expiresAt) = SignToken(user.Id, user.Username, user.Role, fy.DatabaseName);
        var permissions = await ResolvePermissionsAsync(user, cancellationToken);

        var result = new LoginResultDto(
            token,
            expiresAt.ToString("O"),
            ToUserDto(user),
            permissions,
            company is null
                ? new CompanySummaryDto("IMS", "Inventory Management System", "Inventory & Billing ERP")
                : new CompanySummaryDto(company.Code, company.BusinessName, company.Tagline ?? "Inventory & Billing ERP"),
            license,
            new FinancialYearSummaryDto(
                fy.Id,
                fy.FinancialYearName,
                fy.StartDate,
                fy.EndDate,
                fy.DatabaseName,
                fy.IsActive,
                fy.Closed));

        return (true, 200, null, result);
    }

    public async Task<(bool Ok, AuthUserDto? User, IReadOnlyList<MenuPermissionDto> Permissions)> GetMeAsync(
        string token,
        CancellationToken cancellationToken = default)
    {
        if (!TryVerifyToken(token, out var payload) || payload is null)
            return (false, null, Array.Empty<MenuPermissionDto>());

        var user = await _db.AppUsers.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == payload.Sub && u.ActiveStatus, cancellationToken);
        if (user is null)
            return (false, null, Array.Empty<MenuPermissionDto>());

        var permissions = await ResolvePermissionsAsync(user, cancellationToken);
        return (true, ToUserDto(user), permissions);
    }

    public (string Token, DateTime ExpiresAt) SignToken(string userId, string username, string role, string yearDb)
    {
        var exp = DateTimeOffset.UtcNow.Add(TokenTtl).ToUnixTimeMilliseconds();
        var payload = new Dictionary<string, object?>
        {
            ["sub"] = userId,
            ["username"] = username,
            ["role"] = role,
            ["yearDb"] = yearDb,
            ["exp"] = exp
        };
        var body = Base64UrlEncode(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload)));
        var sig = Base64UrlEncode(HmacSha256(Encoding.UTF8.GetBytes(body)));
        return ($"{body}.{sig}", DateTimeOffset.FromUnixTimeMilliseconds(exp).UtcDateTime);
    }

    public bool TryVerifyToken(string token, out TokenPayload? payload)
    {
        payload = null;
        if (string.IsNullOrWhiteSpace(token)) return false;

        var parts = token.Split('.', 2);
        if (parts.Length != 2) return false;

        var body = parts[0];
        var sig = parts[1];
        var expected = Base64UrlEncode(HmacSha256(Encoding.UTF8.GetBytes(body)));
        if (!CryptographicEquals(sig, expected)) return false;

        try
        {
            var json = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(Base64UrlDecode(body));
            if (json is null || !json.TryGetValue("exp", out var expEl)) return false;
            var exp = expEl.GetInt64();
            if (DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() > exp) return false;

            payload = new TokenPayload(
                json.GetValueOrDefault("sub").GetString() ?? "",
                json.GetValueOrDefault("username").GetString() ?? "",
                json.GetValueOrDefault("role").GetString() ?? "",
                json.GetValueOrDefault("yearDb").GetString() ?? "",
                exp);
            return !string.IsNullOrEmpty(payload.Sub);
        }
        catch
        {
            return false;
        }
    }

    public static string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltLen);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA512,
            KeyLen);
        return $"{Iterations}:{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
    }

    public static bool VerifyPassword(string password, string stored)
    {
        if (string.IsNullOrWhiteSpace(stored)) return false;
        var parts = stored.Split(':');
        if (parts.Length != 3) return false;
        if (!int.TryParse(parts[0], out var iterations) || iterations < 1) return false;

        try
        {
            var salt = Convert.FromBase64String(parts[1]);
            var expected = Convert.FromBase64String(parts[2]);
            var actual = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                iterations,
                HashAlgorithmName.SHA512,
                expected.Length);
            return CryptographicEquals(actual, expected);
        }
        catch
        {
            return false;
        }
    }

    private async Task<LicenseStatusDto> GetLicenseStatusAsync(CancellationToken cancellationToken)
    {
        var license = await _db.SoftwareLicenses.AsNoTracking().OrderBy(x => x.ActivatedAt).FirstOrDefaultAsync(cancellationToken);
        if (license?.ExpiresAt is null)
            return new LicenseStatusDto(license?.LicenseType ?? "trial", false, license?.ExpiresAt, null);

        var days = (int)Math.Ceiling((license.ExpiresAt.Value - DateTime.UtcNow).TotalDays);
        return new LicenseStatusDto(license.LicenseType, days < 0, license.ExpiresAt, Math.Max(days, 0));
    }

    private static bool IsAdministratorRole(string role) =>
        string.Equals(role, "administrator", StringComparison.OrdinalIgnoreCase);

    private static AuthUserDto ToUserDto(AppUser user) => new(
        user.Id,
        user.Username,
        string.IsNullOrEmpty(user.EmployeeId) ? user.Username : user.EmployeeId,
        user.FullName,
        user.Role,
        user.RoleId,
        user.Department ?? "",
        user.Email ?? "",
        user.CanPrintBarcodeLabels || IsAdministratorRole(user.Role));

    private Task<IReadOnlyList<MenuPermissionDto>> ResolvePermissionsAsync(AppUser user, CancellationToken cancellationToken)
    {
        // Administrator gets full access; detailed RBAC ported in phase 2.
        if (IsAdministratorRole(user.Role))
        {
            return Task.FromResult<IReadOnlyList<MenuPermissionDto>>(new[]
            {
                new MenuPermissionDto("*", true, true, true, true, true)
            });
        }

        return Task.FromResult<IReadOnlyList<MenuPermissionDto>>(Array.Empty<MenuPermissionDto>());
    }

    private byte[] HmacSha256(byte[] data)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(Secret));
        return hmac.ComputeHash(data);
    }

    private static string Base64UrlEncode(byte[] data) =>
        Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] Base64UrlDecode(string input)
    {
        var padded = input.Replace('-', '+').Replace('_', '/');
        switch (padded.Length % 4)
        {
            case 2: padded += "=="; break;
            case 3: padded += "="; break;
        }
        return Convert.FromBase64String(padded);
    }

    private static bool CryptographicEquals(string a, string b)
    {
        var ba = Encoding.UTF8.GetBytes(a);
        var bb = Encoding.UTF8.GetBytes(b);
        return ba.Length == bb.Length && CryptographicOperations.FixedTimeEquals(ba, bb);
    }

    private static bool CryptographicEquals(byte[] a, byte[] b) =>
        a.Length == b.Length && CryptographicOperations.FixedTimeEquals(a, b);
}
