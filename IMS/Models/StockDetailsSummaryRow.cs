namespace IMS.Models;

public sealed class StockDetailsSummaryRow
{
    public int SerialNo { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string MainGroup { get; set; } = string.Empty;
    public string ProductType { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal OnHandQty { get; set; }
    public decimal PurchaseRate { get; set; }
    public decimal StockValue { get; set; }
    public decimal ReorderLevel { get; set; }
    public decimal ShortageQty { get; set; }
    public string Status { get; set; } = string.Empty;

    public string OnHandQtyDisplay => Format(OnHandQty);
    public string PurchaseRateDisplay => Format(PurchaseRate);
    public string StockValueDisplay => Format(StockValue);
    public string ReorderLevelDisplay => Format(ReorderLevel);
    public string ShortageQtyDisplay => Format(ShortageQty);

    private static string Format(decimal v) => v % 1 == 0 ? v.ToString("N0") : v.ToString("N2");
}

