using Ims.Application.Abstractions;
using Ims.Application.Auth;
using Ims.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Ims.Api.Middleware;

public sealed class FinancialYearMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(
        HttpContext context,
        IFinancialYearContext fyContext,
        IAuthService authService,
        ImsDbContext db)
    {
        var yearDb = context.Items["FinancialYearDb"] as string;
        if (string.IsNullOrWhiteSpace(yearDb))
        {
            var header = context.Request.Headers.Authorization.ToString();
            if (header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                var token = header["Bearer ".Length..].Trim();
                if (authService.TryVerifyToken(token, out var payload) && payload is not null)
                    yearDb = payload.YearDb;
            }
        }

        if (string.IsNullOrWhiteSpace(yearDb))
        {
            yearDb = await db.FinancialYears.AsNoTracking()
                .Where(x => x.IsActive && !x.Closed)
                .OrderByDescending(x => x.StartDate)
                .Select(x => x.DatabaseName)
                .FirstOrDefaultAsync(context.RequestAborted);
        }

        if (!string.IsNullOrWhiteSpace(yearDb))
            fyContext.SetYearDatabaseName(yearDb);

        await next(context);
    }
}

public sealed class RequireAuthMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, IAuthService authService)
    {
        if (context.GetEndpoint()?.Metadata.GetMetadata<AllowAnonymousAttribute>() is not null)
        {
            await next(context);
            return;
        }

        if (!context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        // Only enforce on routes that opt in via RequireAuthAttribute
        if (context.GetEndpoint()?.Metadata.GetMetadata<RequireAuthAttribute>() is null)
        {
            await next(context);
            return;
        }

        var header = context.Request.Headers.Authorization.ToString();
        if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            await WriteJson(context, 401, new { error = "Authentication required." });
            return;
        }

        var token = header["Bearer ".Length..].Trim();
        if (!authService.TryVerifyToken(token, out var payload) || payload is null)
        {
            await WriteJson(context, 401, new { error = "Session expired or invalid." });
            return;
        }

        if (string.IsNullOrWhiteSpace(payload.YearDb))
        {
            await WriteJson(context, 401, new { error = "Financial year session is invalid. Please sign in again." });
            return;
        }

        context.Items["AuthUser"] = payload;
        context.Items["FinancialYearDb"] = payload.YearDb;
        await next(context);
    }

    private static async Task WriteJson(HttpContext context, int status, object body)
    {
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(body);
    }
}

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class RequireAuthAttribute : Attribute;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class AllowAnonymousAttribute : Attribute;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class RequireAdminAttribute : Attribute;
