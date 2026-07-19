using Ims.Application.Abstractions;
using Ims.Application.Auth;
using Ims.Api.Middleware;
using Microsoft.AspNetCore.Mvc;

namespace Ims.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var (ok, status, error, result) = await authService.LoginAsync(
            request.LoginId ?? "",
            request.Password ?? "",
            request.FinancialYearId ?? "",
            ct);

        if (!ok)
            return StatusCode(status, new { error });

        return Ok(new
        {
            token = result!.Token,
            expiresAt = result.ExpiresAt,
            user = result.User,
            permissions = result.Permissions,
            company = result.Company,
            license = result.License,
            financialYear = result.FinancialYear
        });
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public IActionResult Logout() => NoContent();

    [HttpGet("me")]
    [AllowAnonymous]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var header = Request.Headers.Authorization.ToString();
        if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return Unauthorized(new { error = "Authentication required." });

        var token = header["Bearer ".Length..].Trim();
        var (ok, user, permissions) = await authService.GetMeAsync(token, ct);
        if (!ok || user is null)
            return Unauthorized(new { error = "Session expired or invalid." });

        return Ok(new { user, permissions });
    }
}

public sealed class LoginRequest
{
    public string? LoginId { get; set; }
    public string? Password { get; set; }
    public string? FinancialYearId { get; set; }
}
