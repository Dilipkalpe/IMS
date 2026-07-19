namespace IMS.Models;

public sealed class StockMovementReportRow
{
    public int SerialNo { get; init; }
    public string Date { get; init; } = string.Empty;
    public string EntryNo { get; init; } = string.Empty;
    public string MovementType { get; init; } = string.Empty;
    public string FromGodown { get; init; } = string.Empty;
    public string ToGodown { get; init; } = string.Empty;
    public string ProductCode { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public string BatchNo { get; init; } = string.Empty;
    public decimal InQty { get; init; }
    public decimal OutQty { get; init; }
    public string Unit { get; init; } = string.Empty;

    public string InQtyDisplay => InQty > 0 ? InQty.ToString("N2") : string.Empty;
    public string OutQtyDisplay => OutQty > 0 ? OutQty.ToString("N2") : string.Empty;
}
