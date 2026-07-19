using Ims.Domain.Common;

namespace Ims.Domain.Entities;

public sealed class Counter : IYearScoped
{
    public string Id { get; set; } = ObjectIdGenerator.NewId();

    public string YearDatabaseName { get; set; } = string.Empty;

    public string Key { get; set; } = string.Empty;

    public int Value { get; set; }
}

public abstract class NumberedDocumentBase : EntityBase, IYearScoped
{
    public string YearDatabaseName { get; set; } = string.Empty;

    public string DocPrefix { get; set; } = string.Empty;

    public int DocNo { get; set; }

    public string FormattedDocNo { get; set; } = string.Empty;

    public string? Status { get; set; }

    public string? Customer { get; set; }

    public string? Supplier { get; set; }

    public string? SalesMan { get; set; }

    public string? Narration { get; set; }

    public DateTime? TranDate { get; set; }

    /// <summary>Full Mongo-shaped document (jsonb).</summary>
    public string BodyJson { get; set; } = "{}";
}

public sealed class SalesInvoiceDocument : NumberedDocumentBase;
public sealed class DeliveryChallanDocument : NumberedDocumentBase;
public sealed class SalesReturnDocument : NumberedDocumentBase;
public sealed class PurchaseInvoiceDocument : NumberedDocumentBase;
public sealed class GrnDocument : NumberedDocumentBase;
public sealed class PurchaseReturnDocument : NumberedDocumentBase;
public sealed class PurchaseOrderDocument : NumberedDocumentBase;
