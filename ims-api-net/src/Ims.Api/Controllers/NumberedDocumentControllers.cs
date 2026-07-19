using System.Text.Json;
using Ims.Application.Abstractions;
using Ims.Application.Documents;
using Ims.Infrastructure;
using Ims.Infrastructure.Services;
using Ims.Infrastructure.Services.Fulfillment;
using Microsoft.AspNetCore.Mvc;

namespace Ims.Api.Controllers;

[ApiController]
public abstract class NumberedDocumentControllerBase : ControllerBase
{
    protected abstract INumberedDocumentService Service { get; }

    protected string YearDb => HttpContext.RequestServices.GetRequiredService<IFinancialYearContext>().YearDatabaseName
        ?? throw new InvalidOperationException("Financial year context is required.");

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) =>
        Ok(await Service.ListAsync(YearDb, Request.Query, ct));

    [HttpGet("stats")]
    public async Task<IActionResult> Stats(CancellationToken ct) =>
        Ok(await Service.StatsAsync(YearDb, ct));

    [HttpGet("next-no")]
    public async Task<IActionResult> NextNo([FromQuery] string? prefix, CancellationToken ct) =>
        Ok(await Service.NextNoAsync(YearDb, prefix, ct));

    [HttpGet("by-no/{docNo:int}")]
    public async Task<IActionResult> GetByNo(int docNo, [FromQuery] string? prefix, CancellationToken ct)
    {
        var item = await Service.GetByNoAsync(YearDb, docNo, prefix, ct);
        return item is null ? NotFound(new { error = Service.Config.NotFoundLabel }) : Ok(item);
    }

    [HttpGet("by-formatted/{formatted}")]
    public async Task<IActionResult> GetByFormatted(string formatted, CancellationToken ct)
    {
        var decoded = Uri.UnescapeDataString(formatted ?? "").Trim();
        var item = await Service.GetByFormattedAsync(YearDb, decoded, ct);
        return item is null ? NotFound(new { error = Service.Config.NotFoundLabel }) : Ok(item);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken ct)
    {
        var item = await Service.GetByIdAsync(YearDb, id, ct);
        return item is null ? NotFound(new { error = Service.Config.NotFoundLabel }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] JsonElement body, CancellationToken ct)
    {
        try
        {
            var payload = DeserializeBody(body);
            var created = await Service.CreateAsync(YearDb, payload, ct);
            return StatusCode(201, created);
        }
        catch (NumberedDocException ex)
        {
            return StatusCode(ex.Status, new { error = ex.Message });
        }
    }

    [HttpPut("by-no/{docNo:int}")]
    public async Task<IActionResult> UpdateByNo(int docNo, [FromQuery] string? prefix, [FromBody] JsonElement body, CancellationToken ct)
    {
        try
        {
            var payload = DeserializeBody(body);
            var updated = await Service.UpdateByNoAsync(YearDb, docNo, prefix, payload, ct);
            return updated is null ? NotFound(new { error = Service.Config.NotFoundLabel }) : Ok(updated);
        }
        catch (NumberedDocException ex)
        {
            return StatusCode(ex.Status, new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateById(string id, [FromBody] JsonElement body, CancellationToken ct)
    {
        try
        {
            var payload = DeserializeBody(body);
            var updated = await Service.UpdateByIdAsync(YearDb, id, payload, ct);
            return updated is null ? NotFound(new { error = Service.Config.NotFoundLabel }) : Ok(updated);
        }
        catch (NumberedDocException ex)
        {
            return StatusCode(ex.Status, new { error = ex.Message });
        }
    }

    [HttpDelete("by-no/{docNo:int}")]
    public async Task<IActionResult> DeleteByNo(int docNo, [FromQuery] string? prefix, CancellationToken ct)
    {
        try
        {
            var deleted = await Service.DeleteByNoAsync(YearDb, docNo, prefix, ct);
            return deleted ? Ok(new { ok = true }) : NotFound(new { error = Service.Config.NotFoundLabel });
        }
        catch (NumberedDocException ex)
        {
            return StatusCode(ex.Status, new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteById(string id, CancellationToken ct)
    {
        try
        {
            var deleted = await Service.DeleteByIdAsync(YearDb, id, ct);
            return deleted ? Ok(new { ok = true }) : NotFound(new { error = Service.Config.NotFoundLabel });
        }
        catch (NumberedDocException ex)
        {
            return StatusCode(ex.Status, new { error = ex.Message });
        }
    }

    private static Dictionary<string, object?> DeserializeBody(JsonElement body) =>
        JsonSerializer.Deserialize<Dictionary<string, object?>>(body.GetRawText(), new JsonSerializerOptions(JsonSerializerDefaults.Web))
        ?? new Dictionary<string, object?>();
}

[ApiController]
[Route("api/sales-invoices")]
public sealed class SalesInvoicesController(INumberedDocumentServiceFactory factory) : NumberedDocumentControllerBase
{
    protected override INumberedDocumentService Service => factory.Get(NumberedDocKind.SalesInvoice);
}

[ApiController]
[Route("api/delivery-challans")]
public sealed class DeliveryChallansController(
    INumberedDocumentServiceFactory factory,
    DeliveryChallanInvoicingService invoicing) : NumberedDocumentControllerBase
{
    protected override INumberedDocumentService Service => factory.Get(NumberedDocKind.DeliveryChallan);

    [HttpGet("pending-for-invoice")]
    public async Task<IActionResult> PendingForInvoice([FromQuery] string? customer, CancellationToken ct)
    {
        try
        {
            return Ok(await invoicing.ListPendingForInvoiceAsync(customer, ct));
        }
        catch (NumberedDocException ex)
        {
            return StatusCode(ex.Status, new { error = ex.Message });
        }
    }

    [HttpPost("pending-invoice-lines")]
    public async Task<IActionResult> PendingInvoiceLines([FromBody] JsonElement body, CancellationToken ct)
    {
        try
        {
            var customer = body.TryGetProperty("customer", out var c) ? c.GetString() : null;
            var refsEl = body.TryGetProperty("deliveryChallans", out var arr) ? arr : default;
            var refs = PendingRefParser.ParseRefs(refsEl, "DC", "dcPrefix");
            return Ok(await invoicing.BuildPendingInvoiceLinesAsync(customer, refs, ct));
        }
        catch (NumberedDocException ex)
        {
            return StatusCode(ex.Status, new { error = ex.Message });
        }
    }
}

[ApiController]
[Route("api/sales-returns")]
public sealed class SalesReturnsController(INumberedDocumentServiceFactory factory) : NumberedDocumentControllerBase
{
    protected override INumberedDocumentService Service => factory.Get(NumberedDocKind.SalesReturn);
}

[ApiController]
[Route("api/purchase-invoices")]
public sealed class PurchaseInvoicesController(INumberedDocumentServiceFactory factory) : NumberedDocumentControllerBase
{
    protected override INumberedDocumentService Service => factory.Get(NumberedDocKind.PurchaseInvoice);
}

[ApiController]
[Route("api/grns")]
public sealed class GrnsController(
    INumberedDocumentServiceFactory factory,
    GrnInvoicingService invoicing) : NumberedDocumentControllerBase
{
    protected override INumberedDocumentService Service => factory.Get(NumberedDocKind.Grn);

    [HttpGet("pending-for-invoice")]
    public async Task<IActionResult> PendingForInvoice([FromQuery] string? supplier, CancellationToken ct)
    {
        try
        {
            return Ok(await invoicing.ListPendingForInvoiceAsync(supplier, ct));
        }
        catch (NumberedDocException ex)
        {
            return StatusCode(ex.Status, new { error = ex.Message });
        }
    }

    [HttpPost("pending-invoice-lines")]
    public async Task<IActionResult> PendingInvoiceLines([FromBody] JsonElement body, CancellationToken ct)
    {
        try
        {
            var supplier = body.TryGetProperty("supplier", out var s) ? s.GetString() : null;
            var refsEl = body.TryGetProperty("grns", out var arr) ? arr : default;
            var refs = PendingRefParser.ParseRefs(refsEl, "GRN", "grnPrefix");
            return Ok(await invoicing.BuildPendingInvoiceLinesAsync(supplier, refs, ct));
        }
        catch (NumberedDocException ex)
        {
            return StatusCode(ex.Status, new { error = ex.Message });
        }
    }
}

[ApiController]
[Route("api/purchase-returns")]
public sealed class PurchaseReturnsController(INumberedDocumentServiceFactory factory) : NumberedDocumentControllerBase
{
    protected override INumberedDocumentService Service => factory.Get(NumberedDocKind.PurchaseReturn);
}

[ApiController]
[Route("api/purchase-orders")]
public sealed class PurchaseOrdersController(
    INumberedDocumentServiceFactory factory,
    PurchaseOrderFulfillmentService fulfillment) : NumberedDocumentControllerBase
{
    protected override INumberedDocumentService Service => factory.Get(NumberedDocKind.PurchaseOrder);

    [HttpGet("pending-for-receipt")]
    public async Task<IActionResult> PendingForReceipt([FromQuery] string? supplier, CancellationToken ct)
    {
        try
        {
            return Ok(await fulfillment.ListPendingForReceiptAsync(supplier, ct));
        }
        catch (NumberedDocException ex)
        {
            return StatusCode(ex.Status, new { error = ex.Message });
        }
    }

    [HttpPost("pending-receipt-lines")]
    public async Task<IActionResult> PendingReceiptLines([FromBody] JsonElement body, CancellationToken ct)
    {
        try
        {
            var supplier = body.TryGetProperty("supplier", out var s) ? s.GetString() : null;
            var refsEl = body.TryGetProperty("purchaseOrders", out var arr) ? arr : default;
            var refs = PendingRefParser.ParseRefs(refsEl, "PO", "poPrefix");
            return Ok(await fulfillment.BuildPendingReceiptLinesAsync(supplier, refs, ct));
        }
        catch (NumberedDocException ex)
        {
            return StatusCode(ex.Status, new { error = ex.Message });
        }
    }
}
