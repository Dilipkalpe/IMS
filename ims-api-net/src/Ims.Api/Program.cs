using Ims.Api.Middleware;
using Ims.Application.Abstractions;
using Ims.Application.Auth;
using Ims.Application.Services;
using Ims.Infrastructure;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.SetIsOriginAllowed(_ => true).AllowAnyHeader().AllowAnyMethod().AllowCredentials());
});

builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseCors();

var mountPath = (builder.Configuration["IMS_API_MOUNT_PATH"] ?? "").Trim().TrimEnd('/');
if (!string.IsNullOrEmpty(mountPath))
{
    app.Use(async (context, next) =>
    {
        var path = context.Request.Path.Value ?? "";
        if (path == mountPath)
            context.Request.Path = "/";
        else if (path.StartsWith(mountPath + "/", StringComparison.OrdinalIgnoreCase))
            context.Request.Path = path[mountPath.Length..] ?? "/";
        await next();
    });
}

app.UseMiddleware<FinancialYearMiddleware>();
app.UseMiddleware<RequireAuthMiddleware>();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ImsDbContext>();
    await db.Database.MigrateAsync();
    await BootstrapData.EnsureAsync(db);
}

app.Run();
