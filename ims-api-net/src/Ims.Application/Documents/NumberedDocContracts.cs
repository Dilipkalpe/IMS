using Microsoft.AspNetCore.Http;

namespace Ims.Application.Documents;

public enum StockDirection
{
    None,
    In,
    Out
}

public enum NumberedDocKind
{
    SalesInvoice,
    DeliveryChallan,
    SalesReturn,
    PurchaseInvoice,
    Grn,
    PurchaseReturn,
    PurchaseOrder
}

public sealed class NumberedDocConfig
{
    public required NumberedDocKind Kind { get; init; }
    public required string CounterNamespace { get; init; }
    public required string DefaultDocPrefix { get; init; }
    public required string DocTypeKey { get; init; }
    public required string NotFoundLabel { get; init; }
    public required string ApiRoutePrefix { get; init; }
    public StockDirection StockDirection { get; init; } = StockDirection.None;
    public bool IsPurchaseSide { get; init; }
    public bool NormalizeInvoicePayment { get; init; }
    /// <summary>JSON field used for list sort tranDate (e.g. invoiceDate).</summary>
    public string? TranDateField { get; init; }
}

public interface INumberedDocumentHooks
{
    StockDirection? ResolveStockDirection(IReadOnlyDictionary<string, object?> payload) => null;
    Task BeforeCreateAsync(Dictionary<string, object?> payload, CancellationToken ct = default) => Task.CompletedTask;
    Task AfterCreateAsync(string documentId, IReadOnlyDictionary<string, object?> document, CancellationToken ct = default) => Task.CompletedTask;
    Task BeforeUpdateAsync(string documentId, IReadOnlyDictionary<string, object?> existing, Dictionary<string, object?> payload, CancellationToken ct = default) => Task.CompletedTask;
    Task AfterUpdateAsync(string documentId, IReadOnlyDictionary<string, object?> existing, IReadOnlyDictionary<string, object?> updated, CancellationToken ct = default) => Task.CompletedTask;
    Task AfterDeleteAsync(IReadOnlyDictionary<string, object?> document, CancellationToken ct = default) => Task.CompletedTask;
}

public interface INumberedDocumentService
{
    NumberedDocConfig Config { get; }
    Task<object> ListAsync(string yearDb, IQueryCollection query, CancellationToken ct);
    Task<object> StatsAsync(string yearDb, CancellationToken ct);
    Task<object> NextNoAsync(string yearDb, string? prefix, CancellationToken ct);
    Task<object?> GetByNoAsync(string yearDb, int docNo, string? prefix, CancellationToken ct);
    Task<object?> GetByFormattedAsync(string yearDb, string formatted, CancellationToken ct);
    Task<object?> GetByIdAsync(string yearDb, string id, CancellationToken ct);
    Task<object> CreateAsync(string yearDb, IReadOnlyDictionary<string, object?> body, CancellationToken ct);
    Task<object?> UpdateByNoAsync(string yearDb, int docNo, string? prefix, IReadOnlyDictionary<string, object?> body, CancellationToken ct);
    Task<object?> UpdateByIdAsync(string yearDb, string id, IReadOnlyDictionary<string, object?> body, CancellationToken ct);
    Task<bool> DeleteByNoAsync(string yearDb, int docNo, string? prefix, CancellationToken ct);
    Task<bool> DeleteByIdAsync(string yearDb, string id, CancellationToken ct);
}
