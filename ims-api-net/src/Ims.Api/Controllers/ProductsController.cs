using Ims.Application.Abstractions;
using Ims.Application.Services;
using Ims.Domain.Masters;
using Microsoft.AspNetCore.Mvc;

namespace Ims.Api.Controllers;

[ApiController]
[Route("api/products")]
public sealed class ProductsController(IProductService products, IFinancialYearContext fyContext) : ControllerBase
{
    private string YearDb => fyContext.YearDatabaseName ?? throw new InvalidOperationException("Financial year context is required.");

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 100,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await products.ListAsync(YearDb, page, limit, search, ct);
        return Ok(result);
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] int limit = 40, CancellationToken ct = default)
    {
        var capped = Math.Clamp(limit, 1, 100);
        return Ok(await products.SearchAsync(YearDb, q ?? "", capped, ct));
    }

    [HttpGet("lookup")]
    public async Task<IActionResult> Lookup([FromQuery] string? q, CancellationToken ct = default)
    {
        var result = await products.LookupAsync(YearDb, q ?? "", ct);
        return result is null ? Ok(null) : Ok(result);
    }

    [HttpGet("by-code/{code}")]
    public async Task<IActionResult> GetByCode(string code, CancellationToken ct)
    {
        var product = await products.GetByCodeAsync(YearDb, code, ct);
        return product is null ? NotFound(new { error = "Product not found" }) : Ok(MongoJson.MapProduct(product));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken ct)
    {
        var product = await products.GetByIdAsync(YearDb, id, ct);
        return product is null ? NotFound(new { error = "Product not found" }) : Ok(MongoJson.MapProduct(product));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Product body, CancellationToken ct)
    {
        var created = await products.CreateAsync(YearDb, body, ct);
        return StatusCode(201, MongoJson.MapProduct(created));
    }

    [HttpPut("by-code/{code}")]
    public async Task<IActionResult> UpdateByCode(string code, [FromBody] Product body, CancellationToken ct)
    {
        var updated = await products.UpdateByCodeAsync(YearDb, code, body, ct);
        return updated is null ? NotFound(new { error = "Product not found" }) : Ok(MongoJson.MapProduct(updated));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateById(string id, [FromBody] Product body, CancellationToken ct)
    {
        var updated = await products.UpdateByIdAsync(YearDb, id, body, ct);
        return updated is null ? NotFound(new { error = "Product not found" }) : Ok(MongoJson.MapProduct(updated));
    }

    [HttpDelete("by-code/{code}")]
    public async Task<IActionResult> DeleteByCode(string code, CancellationToken ct)
    {
        var deleted = await products.DeleteByCodeAsync(YearDb, code, ct);
        return deleted ? NoContent() : NotFound(new { error = "Product not found" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteById(string id, CancellationToken ct)
    {
        var deleted = await products.DeleteByIdAsync(YearDb, id, ct);
        return deleted ? NoContent() : NotFound(new { error = "Product not found" });
    }
}
