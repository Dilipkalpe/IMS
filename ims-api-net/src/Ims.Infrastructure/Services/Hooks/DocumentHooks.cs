using System.Text.Json;
using Ims.Application.Documents;
using Ims.Infrastructure.Services.Fulfillment;

namespace Ims.Infrastructure.Services.Hooks;

public sealed class EmptyDocumentHooks : INumberedDocumentHooks;

public static class DocumentHookHelpers
{
    public static bool HasDcSourceLines(IReadOnlyDictionary<string, object?> payload) =>
        FulfillmentQty.ExtractLines(payload.GetValueOrDefault("lines")).Any(HasDcRef);

    public static bool HasGrnSourceLines(IReadOnlyDictionary<string, object?> payload) =>
        FulfillmentQty.ExtractLines(payload.GetValueOrDefault("lines")).Any(HasGrnRef);

    private static bool HasDcRef(Dictionary<string, object?> line) =>
        HasRef(line, "dcDocNo", "dcLineSr");

    private static bool HasGrnRef(Dictionary<string, object?> line) =>
        HasRef(line, "grnDocNo", "grnLineSr");

    private static bool HasRef(Dictionary<string, object?> line, string docKey, string srKey) =>
        line.TryGetValue(docKey, out var docNo) && HasNonNullValue(docNo) &&
        line.TryGetValue(srKey, out var sr) && HasNonNullValue(sr);

    private static bool HasNonNullValue(object? value)
    {
        if (value is null) return false;
        if (value is JsonElement el)
            return el.ValueKind is not JsonValueKind.Null and not JsonValueKind.Undefined;
        return true;
    }
}

public sealed class SalesInvoiceDocumentHooks(DeliveryChallanInvoicingService invoicing) : INumberedDocumentHooks
{
    public StockDirection? ResolveStockDirection(IReadOnlyDictionary<string, object?> payload) =>
        DocumentHookHelpers.HasDcSourceLines(payload) ? StockDirection.None : StockDirection.Out;

    public async Task BeforeCreateAsync(Dictionary<string, object?> payload, CancellationToken ct = default) =>
        await invoicing.ValidateSalesInvoiceLinesAsync(payload, null, ct);

    public async Task BeforeUpdateAsync(
        string documentId,
        IReadOnlyDictionary<string, object?> existing,
        Dictionary<string, object?> payload,
        CancellationToken ct = default) =>
        await invoicing.ValidateSalesInvoiceLinesAsync(payload, documentId, ct);

    public async Task AfterCreateAsync(string documentId, IReadOnlyDictionary<string, object?> document, CancellationToken ct = default) =>
        await invoicing.ApplySalesInvoiceFulfillmentAsync(document, ct);

    public async Task AfterUpdateAsync(
        string documentId,
        IReadOnlyDictionary<string, object?> existing,
        IReadOnlyDictionary<string, object?> updated,
        CancellationToken ct = default)
    {
        var keys = DeliveryChallanInvoicingService.CollectDcKeysFromLines(
                FulfillmentQty.ExtractLines(existing.GetValueOrDefault("lines")))
            .Concat(DeliveryChallanInvoicingService.CollectDcKeysFromLines(
                FulfillmentQty.ExtractLines(updated.GetValueOrDefault("lines"))));
        await invoicing.RefreshInvoicingForDeliveryChallansAsync(keys, ct);
    }

    public async Task AfterDeleteAsync(IReadOnlyDictionary<string, object?> document, CancellationToken ct = default)
    {
        var keys = DeliveryChallanInvoicingService.CollectDcKeysFromLines(
            FulfillmentQty.ExtractLines(document.GetValueOrDefault("lines")));
        await invoicing.RefreshInvoicingForDeliveryChallansAsync(keys, ct);
    }
}

public sealed class PurchaseInvoiceDocumentHooks(GrnInvoicingService invoicing) : INumberedDocumentHooks
{
    public StockDirection? ResolveStockDirection(IReadOnlyDictionary<string, object?> payload) =>
        DocumentHookHelpers.HasGrnSourceLines(payload) ? StockDirection.None : StockDirection.In;

    public async Task BeforeCreateAsync(Dictionary<string, object?> payload, CancellationToken ct = default) =>
        await invoicing.ValidatePurchaseInvoiceLinesAsync(payload, null, ct);

    public async Task BeforeUpdateAsync(
        string documentId,
        IReadOnlyDictionary<string, object?> existing,
        Dictionary<string, object?> payload,
        CancellationToken ct = default) =>
        await invoicing.ValidatePurchaseInvoiceLinesAsync(payload, documentId, ct);

    public async Task AfterCreateAsync(string documentId, IReadOnlyDictionary<string, object?> document, CancellationToken ct = default) =>
        await invoicing.ApplyPurchaseInvoiceFulfillmentAsync(document, ct);

    public async Task AfterUpdateAsync(
        string documentId,
        IReadOnlyDictionary<string, object?> existing,
        IReadOnlyDictionary<string, object?> updated,
        CancellationToken ct = default)
    {
        var keys = GrnInvoicingService.CollectGrnKeysFromLines(
                FulfillmentQty.ExtractLines(existing.GetValueOrDefault("lines")))
            .Concat(GrnInvoicingService.CollectGrnKeysFromLines(
                FulfillmentQty.ExtractLines(updated.GetValueOrDefault("lines"))));
        await invoicing.RefreshInvoicingForGrnsAsync(keys, ct);
    }

    public async Task AfterDeleteAsync(IReadOnlyDictionary<string, object?> document, CancellationToken ct = default)
    {
        var keys = GrnInvoicingService.CollectGrnKeysFromLines(
            FulfillmentQty.ExtractLines(document.GetValueOrDefault("lines")));
        await invoicing.RefreshInvoicingForGrnsAsync(keys, ct);
    }
}

public sealed class GrnDocumentHooks(PurchaseOrderFulfillmentService fulfillment) : INumberedDocumentHooks
{
    public async Task BeforeCreateAsync(Dictionary<string, object?> payload, CancellationToken ct = default) =>
        await fulfillment.ValidateGrnLinesAsync(payload, null, ct);

    public async Task BeforeUpdateAsync(
        string documentId,
        IReadOnlyDictionary<string, object?> existing,
        Dictionary<string, object?> payload,
        CancellationToken ct = default) =>
        await fulfillment.ValidateGrnLinesAsync(payload, documentId, ct);

    public async Task AfterCreateAsync(string documentId, IReadOnlyDictionary<string, object?> document, CancellationToken ct = default) =>
        await fulfillment.ApplyGrnFulfillmentAsync(document, ct);

    public async Task AfterUpdateAsync(
        string documentId,
        IReadOnlyDictionary<string, object?> existing,
        IReadOnlyDictionary<string, object?> updated,
        CancellationToken ct = default)
    {
        var keys = PurchaseOrderFulfillmentService.CollectPoKeysFromLines(
                FulfillmentQty.ExtractLines(existing.GetValueOrDefault("lines")))
            .Concat(PurchaseOrderFulfillmentService.CollectPoKeysFromLines(
                FulfillmentQty.ExtractLines(updated.GetValueOrDefault("lines"))));
        await fulfillment.RefreshFulfillmentForPurchaseOrdersAsync(keys, ct);
    }

    public async Task AfterDeleteAsync(IReadOnlyDictionary<string, object?> document, CancellationToken ct = default)
    {
        var keys = PurchaseOrderFulfillmentService.CollectPoKeysFromLines(
            FulfillmentQty.ExtractLines(document.GetValueOrDefault("lines")));
        await fulfillment.RefreshFulfillmentForPurchaseOrdersAsync(keys, ct);
    }
}

/// <summary>
/// SO↔DC fulfillment requires SalesOrder entity (not yet migrated). Stock still moves on DC create/update/delete.
/// </summary>
public sealed class DeliveryChallanDocumentHooks : INumberedDocumentHooks;
