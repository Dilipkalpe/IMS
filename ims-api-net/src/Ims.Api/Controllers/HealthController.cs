using Ims.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ims.Api.Controllers;

[ApiController]
public sealed class HealthController(ImsDbContext db) : ControllerBase
{
    [HttpGet("/")]
    public IActionResult Root() => Redirect("/api/health");

    [HttpGet("/api")]
    public IActionResult ApiRoot() => Ok(new
    {
        service = "ims-api",
        status = "running",
        message = "REST API for IMS desktop app. Open these URLs in the browser or use the WPF app.",
        endpoints = new
        {
            health = "GET /api/health",
            products = "GET /api/products",
            auth = "POST /api/auth/login"
        }
    });

    [HttpGet("/api/health")]
    public async Task<IActionResult> Health(CancellationToken ct)
    {
        var dbOk = false;
        try
        {
            dbOk = await db.Database.CanConnectAsync(ct);
        }
        catch
        {
            dbOk = false;
        }

        return Ok(new
        {
            status = dbOk ? "healthy" : "degraded",
            service = "ims-api",
            database = dbOk ? "connected" : "disconnected",
            build = "dotnet8-postgresql-migration"
        });
    }
}
