namespace IMS.Models;

public sealed class FinancialStatementRow
{
    public int SerialNo { get; init; }
    public string Section { get; init; } = string.Empty;
    public string Particular { get; init; } = string.Empty;
    public decimal Debit { get; init; }
    public decimal Credit { get; init; }
    public string DebitDisplay { get; init; } = string.Empty;
    public string CreditDisplay { get; init; } = string.Empty;

    public bool IsTotal =>
        string.Equals(Particular, "Total :", StringComparison.OrdinalIgnoreCase);
}
