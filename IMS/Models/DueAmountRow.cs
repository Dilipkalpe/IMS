namespace IMS.Models;

public sealed class DueAmountRow
{
    public int SerialNo { get; init; }
    public string Slab { get; init; } = string.Empty;
    public int InvoiceCount { get; init; }
    public int PartyCount { get; init; }
    public decimal Amount { get; init; }

    public bool IsTotal => string.Equals(Slab, "Total :", StringComparison.OrdinalIgnoreCase);
    public string AmountDisplay => Amount % 1 == 0 ? Amount.ToString("N0") : Amount.ToString("N2");
}
