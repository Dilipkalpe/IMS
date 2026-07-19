using Ims.Domain.Config;
using Ims.Domain.Masters;
using Ims.Infrastructure;
using Ims.Infrastructure.Auth;
using Microsoft.EntityFrameworkCore;

namespace Ims.Infrastructure;

public static class BootstrapData
{
    public static async Task EnsureAsync(ImsDbContext db, CancellationToken ct = default)
    {
        if (!await db.FinancialYears.AnyAsync(ct))
        {
            var fy = new FinancialYear
            {
                FinancialYearName = "2025-26",
                StartDate = new DateTime(2025, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                EndDate = new DateTime(2026, 3, 31, 0, 0, 0, DateTimeKind.Utc),
                DatabaseName = "IWM_2526",
                IsActive = true
            };
            db.FinancialYears.Add(fy);

            db.AppUsers.Add(new AppUser
            {
                YearDatabaseName = fy.DatabaseName,
                EmployeeId = "admin",
                Username = "admin",
                FullName = "Administrator",
                Role = "administrator",
                PasswordHash = AuthService.HashPassword("admin"),
                ActiveStatus = true,
                CanPrintBarcodeLabels = true
            });

            db.Companies.Add(new Company
            {
                YearDatabaseName = fy.DatabaseName,
                Code = "IMS",
                BusinessName = "Inventory Management System",
                Tagline = "Inventory & Billing ERP",
                IsDefault = true,
                ActiveStatus = true
            });
        }

        if (!await db.SoftwareLicenses.AnyAsync(ct))
        {
            db.SoftwareLicenses.Add(new SoftwareLicense
            {
                Key = "default",
                LicenseType = "trial",
                PlanDays = 365,
                ActivatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(365)
            });
        }

        await db.SaveChangesAsync(ct);
    }
}
