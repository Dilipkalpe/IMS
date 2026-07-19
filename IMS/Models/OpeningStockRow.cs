namespace IMS.Models;

public sealed class OpeningStockRow
{
    public int SerialNo { get; init; }
    public string ItemId { get; init; } = string.Empty;
    public string ItemName { get; init; } = string.Empty;
    public string Unit { get; init; } = string.Empty;
    public string Date { get; init; } = string.Empty;
    public decimal Qty { get; init; }
    public decimal Rate { get; init; }
    public decimal Valuation { get; init; }

    public string QtyDisplay => FormatQty(Qty);
    public string RateDisplay => FormatMoney(Rate);
    public string ValuationDisplay => FormatMoney(Valuation);

    private static string FormatQty(decimal value) =>
        value % 1 == 0 ? value.ToString("N0") : value.ToString("N2");

    private static string FormatMoney(decimal value) =>
        value % 1 == 0 ? value.ToString("N0") : value.ToString("N2");
}
