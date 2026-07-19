namespace IMS.Models;

public sealed class ReorderLevelRow
{
    public int SerialNo { get; init; }
    public string ProductId { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public string Unit { get; init; } = string.Empty;
    public decimal OnHand { get; init; }
    public decimal ReorderLevel { get; init; }
    public decimal Shortage { get; init; }
    public string Status { get; init; } = string.Empty;

    public bool IsTotal => string.Equals(ProductName, "Total :", StringComparison.OrdinalIgnoreCase);
    public string OnHandDisplay => FormatQty(OnHand);
    public string ReorderLevelDisplay => FormatQty(ReorderLevel);
    public string ShortageDisplay => FormatQty(Shortage);

    private static string FormatQty(decimal value) =>
        value % 1 == 0 ? value.ToString("N0") : value.ToString("N2");
}
