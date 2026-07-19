namespace IMS.Models;

public sealed class SalesOrderListRow
{
    public int SerialNo { get; set; }
    public string? Id { get; init; }
    public string SoNo { get; init; } = string.Empty;
    public string SoDate { get; init; } = string.Empty;
    public string Customer { get; init; } = string.Empty;
    public decimal TotalTaxable { get; init; }
    public decimal TotalCgst { get; init; }
    public decimal TotalSgst { get; init; }
    public decimal TotalIgst { get; init; }
    public decimal TotalDiscount { get; init; }
    public decimal SalesAmount { get; init; }
    public decimal PaidAmount { get; init; }
    public decimal Balance { get; init; }
    public string Status { get; init; } = string.Empty;

    public string TotalTaxableDisplay => TotalTaxable.ToString("N2");
    public string TotalCgstDisplay => TotalCgst.ToString("N2");
    public string TotalSgstDisplay => TotalSgst.ToString("N2");
    public string TotalIgstDisplay => TotalIgst.ToString("N2");
    public string TotalDiscountDisplay => TotalDiscount.ToString("N2");
    public string SalesAmountDisplay => SalesAmount.ToString("N2");
    public string PaidAmountDisplay => PaidAmount.ToString("N2");
    public string BalanceDisplay => Balance.ToString("N2");
}
