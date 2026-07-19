namespace IMS.Models;

public sealed class SalesAnalysisRow
{
    public int SerialNo { get; init; }
    public string ProductId { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public string MainGroup { get; init; } = string.Empty;
    public string Customer { get; init; } = string.Empty;
    public decimal Qty { get; init; }
    public decimal Revenue { get; init; }
    public decimal Discount { get; init; }
    public decimal Cogs { get; init; }
    public decimal GrossProfit { get; init; }
    public decimal MarginPct { get; init; }
    public int InvoiceCount { get; init; }

    public bool IsTotal => string.Equals(ProductName, "Total :", StringComparison.OrdinalIgnoreCase);
    public string QtyDisplay => FormatQty(Qty);
    public string RevenueDisplay => FormatMoney(Revenue);
    public string DiscountDisplay => FormatMoney(Discount);
    public string CogsDisplay => FormatMoney(Cogs);
    public string GrossProfitDisplay => FormatMoney(GrossProfit);
    public string MarginPctDisplay => $"{MarginPct:N2}%";

    private static string FormatQty(decimal value) =>
        value % 1 == 0 ? value.ToString("N0") : value.ToString("N2");

    private static string FormatMoney(decimal value) =>
        value % 1 == 0 ? value.ToString("N0") : value.ToString("N2");
}
