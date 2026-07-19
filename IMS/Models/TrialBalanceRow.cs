namespace IMS.Models;

public sealed class TrialBalanceRow
{
    public int SerialNo { get; init; }

    public string AccountCode { get; init; } = string.Empty;

    public string AccountName { get; init; } = string.Empty;

    public string DrDisplay { get; init; } = "0";

    public string CrDisplay { get; init; } = "0";

    public bool IsTotal =>
        string.Equals(AccountName, "Total :", StringComparison.OrdinalIgnoreCase);
}
