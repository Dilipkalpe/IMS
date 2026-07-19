namespace IMS.Models;

/// <summary>Prefill data when opening a receipt/payment voucher from an invoice.</summary>
public sealed class InvoicePaymentSeed
{
    public required string SourceDocType { get; init; }

    public string? SourceDocId { get; init; }

    public required string FormattedDocNo { get; init; }

    public required string PartyName { get; init; }

    public string? PartyAccountCode { get; init; }

    public decimal AmountDue { get; init; }

    public string CashBank { get; init; } = "CASH";

    /// <summary>receipt (sales) or payment (purchase).</summary>
    public string VoucherKind { get; init; } = "receipt";
}
