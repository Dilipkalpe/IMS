namespace IMS.Models;

public sealed class DueDayRow
{
    public int SerialNo { get; init; }
    public string PartyType { get; init; } = string.Empty;
    public string PartyName { get; init; } = string.Empty;
    public string DocNo { get; init; } = string.Empty;
    public string DueDate { get; init; } = string.Empty;
    public int DueDays { get; init; }
    public string DueBucket { get; init; } = string.Empty;
    public decimal BalanceDue { get; init; }

    public bool IsTotal => string.Equals(PartyName, "Total :", StringComparison.OrdinalIgnoreCase);
    public string BalanceDueDisplay => FormatMoney(BalanceDue);

    private static string FormatMoney(decimal value) =>
        value % 1 == 0 ? value.ToString("N0") : value.ToString("N2");
}
