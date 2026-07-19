using Ims.Api.Middleware;
using Ims.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ims.Api.Controllers;

[ApiController]
[Route("api/financial-years")]
public sealed class FinancialYearsController(ImsDbContext db) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var items = await db.FinancialYears.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.StartDate)
            .Select(x => new
            {
                _id = x.Id,
                id = x.Id,
                financialYearName = x.FinancialYearName,
                startDate = x.StartDate,
                endDate = x.EndDate,
                databaseName = x.DatabaseName,
                isActive = x.IsActive,
                closed = x.Closed,
                previousYearId = x.PreviousYearId,
                createdDate = x.CreatedDate,
                createdBy = x.CreatedBy
            })
            .ToListAsync(ct);

        return Ok(items);
    }
}
