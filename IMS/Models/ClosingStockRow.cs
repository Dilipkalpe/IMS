namespace IMS.Models;

public sealed class ClosingStockRow
{
    public int SerialNo { get; init; }
    public string ProductId { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public string Unit { get; init; } = string.Empty;
    public decimal OpStock { get; init; }
    public decimal Inward { get; init; }
    public decimal Outward { get; init; }
    public decimal ClosingStock { get; init; }
    public decimal AvgRate { get; init; }
    public decimal Valuation { get; init; }
    public decimal ReorderLevel { get; init; }

    public string OpStockDisplay => FormatQty(OpStock);
    public string InwardDisplay => FormatQty(Inward);
    public string OutwardDisplay => FormatQty(Outward);
    public string ClosingStockDisplay => FormatQty(ClosingStock);
    public string AvgRateDisplay => FormatMoney(AvgRate);
    public string ValuationDisplay => FormatMoney(Valuation);
    public string ReorderLevelDisplay => FormatQty(ReorderLevel);

    private static string FormatQty(decimal value) =>
        value % 1 == 0 ? value.ToString("N0") : value.ToString("N2");

    private static string FormatMoney(decimal value) =>
        value % 1 == 0 ? value.ToString("N0") : value.ToString("N2");
}
