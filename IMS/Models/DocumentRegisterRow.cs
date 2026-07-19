namespace IMS.Models;

public sealed class DocumentRegisterRow
{
    public int SerialNo { get; init; }
    public string BillNo { get; init; } = string.Empty;
    public string BillDate { get; init; } = string.Empty;
    public string Party { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string AmountDisplay { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Narration { get; init; } = string.Empty;
    public bool IsTotal { get; init; }
}
