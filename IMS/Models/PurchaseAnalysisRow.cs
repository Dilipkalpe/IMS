namespace IMS.Models;

public sealed class PurchaseAnalysisRow
{
    public int SerialNo { get; init; }
    public string ProductId { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public string Supplier { get; init; } = string.Empty;
    public string MainGroup { get; init; } = string.Empty;
    public decimal Qty { get; init; }
    public decimal PurchaseAmount { get; init; }
    public decimal Discount { get; init; }
    public decimal AvgRate { get; init; }
    public int InvoiceCount { get; init; }

    public bool IsTotal => string.Equals(ProductName, "Total :", StringComparison.OrdinalIgnoreCase);
    public string QtyDisplay => FormatQty(Qty);
    public string PurchaseAmountDisplay => FormatMoney(PurchaseAmount);
    public string DiscountDisplay => FormatMoney(Discount);
    public string AvgRateDisplay => FormatMoney(AvgRate);

    private static string FormatQty(decimal value) =>
        value % 1 == 0 ? value.ToString("N0") : value.ToString("N2");

    private static string FormatMoney(decimal value) =>
        value % 1 == 0 ? value.ToString("N0") : value.ToString("N2");
}
