using Ims.Application.Abstractions;
using Ims.Application.Auth;
using Ims.Application.Services;
using Ims.Infrastructure.Auth;
using Ims.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ims.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("PostgreSQL")
            ?? configuration["DATABASE_URL"]
            ?? "Host=127.0.0.1;Port=5432;Database=ims;Username=postgres;Password=postgres";

        services.AddDbContext<ImsDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IFinancialYearContext, FinancialYearContext>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddNumberedDocuments();

        return services;
    }
}
