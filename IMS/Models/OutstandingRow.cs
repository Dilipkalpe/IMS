namespace IMS.Models;

public sealed class OutstandingRow
{
    public int SerialNo { get; init; }
    public string PartyType { get; init; } = string.Empty;
    public string PartyName { get; init; } = string.Empty;
    public string DocNo { get; init; } = string.Empty;
    public string InvoiceDate { get; init; } = string.Empty;
    public string DueDate { get; init; } = string.Empty;
    public decimal BillAmount { get; init; }
    public decimal PaidAmount { get; init; }
    public decimal BalanceDue { get; init; }
    public int AgeDays { get; init; }
    public int DueDays { get; init; }
    public string DueStatus { get; init; } = string.Empty;

    public bool IsTotal => string.Equals(PartyName, "Total :", StringComparison.OrdinalIgnoreCase);
    public string BillAmountDisplay => FormatMoney(BillAmount);
    public string PaidAmountDisplay => FormatMoney(PaidAmount);
    public string BalanceDueDisplay => FormatMoney(BalanceDue);

    private static string FormatMoney(decimal value) =>
        value % 1 == 0 ? value.ToString("N0") : value.ToString("N2");
}
