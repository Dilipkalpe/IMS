using Ims.Application.Abstractions;
using Ims.Application.Services;
using Ims.Domain.Masters;
using Ims.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ims.Api.Controllers;

[ApiController]
[Route("api/accounts")]
public sealed class AccountsController(ImsDbContext db, IFinancialYearContext fyContext) : ControllerBase
{
    private string YearDb => fyContext.YearDatabaseName ?? throw new InvalidOperationException("Financial year context is required.");

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 100,
        [FromQuery] string? search = null,
        [FromQuery] string? accountType = null,
        CancellationToken ct = default)
    {
        var query = db.Accounts.AsNoTracking().Where(a => a.YearDatabaseName == YearDb);
        if (!string.IsNullOrWhiteSpace(accountType))
            query = query.Where(a => a.AccountType == accountType);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(a => EF.Functions.ILike(a.Code, $"%{term}%") || EF.Functions.ILike(a.Name, $"%{term}%"));
        }

        var total = await query.CountAsync(ct);
        var items = await query.OrderBy(a => a.Code).Skip((page - 1) * limit).Take(limit).ToListAsync(ct);
        return Ok(new { items = items.Select(MongoJson.MapAccount), total, page, limit });
    }

    [HttpGet("names")]
    public async Task<IActionResult> Names([FromQuery] string? accountType = null, CancellationToken ct = default)
    {
        var query = db.Accounts.AsNoTracking().Where(a => a.YearDatabaseName == YearDb && a.ActiveStatus);
        if (!string.IsNullOrWhiteSpace(accountType))
            query = query.Where(a => a.AccountType == accountType);

        var items = await query.OrderBy(a => a.Name)
            .Select(a => new { a.Code, a.Name, a.AccountType })
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpGet("by-code/{code}")]
    public async Task<IActionResult> GetByCode(string code, CancellationToken ct)
    {
        var account = await db.Accounts.AsNoTracking()
            .FirstOrDefaultAsync(a => a.YearDatabaseName == YearDb && a.Code == code.ToUpperInvariant(), ct);
        return account is null ? NotFound(new { error = "Account not found" }) : Ok(MongoJson.MapAccount(account));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Account body, CancellationToken ct)
    {
        body.Id = Domain.Common.ObjectIdGenerator.NewId();
        body.YearDatabaseName = YearDb;
        body.Code = body.Code.Trim().ToUpperInvariant();
        body.CreatedAt = body.UpdatedAt = DateTime.UtcNow;
        db.Accounts.Add(body);
        await db.SaveChangesAsync(ct);
        return StatusCode(201, MongoJson.MapAccount(body));
    }

    [HttpPut("by-code/{code}")]
    public async Task<IActionResult> UpdateByCode(string code, [FromBody] Account body, CancellationToken ct)
    {
        var account = await db.Accounts.FirstOrDefaultAsync(
            a => a.YearDatabaseName == YearDb && a.Code == code.ToUpperInvariant(), ct);
        if (account is null) return NotFound(new { error = "Account not found" });
        account.Name = body.Name ?? account.Name;
        account.ContactPerson = body.ContactPerson;
        account.Address = body.Address;
        account.City = body.City;
        account.State = body.State;
        account.Pincode = body.Pincode;
        account.Phone = body.Phone;
        account.MobileNo = body.MobileNo;
        account.Email = body.Email;
        account.Gstin = body.Gstin;
        account.Pan = body.Pan;
        account.CreditLimit = body.CreditLimit;
        account.CreditDays = body.CreditDays;
        account.OpeningBalance = body.OpeningBalance;
        account.OpeningBalanceType = body.OpeningBalanceType;
        account.CustomerType = body.CustomerType;
        account.ActiveStatus = body.ActiveStatus;
        account.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(MongoJson.MapAccount(account));
    }

    [HttpDelete("by-code/{code}")]
    public async Task<IActionResult> DeleteByCode(string code, CancellationToken ct)
    {
        var account = await db.Accounts.FirstOrDefaultAsync(
            a => a.YearDatabaseName == YearDb && a.Code == code.ToUpperInvariant(), ct);
        if (account is null) return NotFound(new { error = "Account not found" });
        db.Accounts.Remove(account);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteById(string id, CancellationToken ct)
    {
        var account = await db.Accounts.FirstOrDefaultAsync(
            a => a.YearDatabaseName == YearDb && a.Id == id, ct);
        if (account is null) return NotFound(new { error = "Account not found" });
        db.Accounts.Remove(account);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
