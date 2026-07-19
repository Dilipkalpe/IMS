namespace IMS.Models;

public sealed class LedgerReportRow
{
    public string RowType { get; init; } = "transaction";

    public string EntryDate { get; init; } = string.Empty;

    public string EntryType { get; init; } = string.Empty;

    public string EntryNo { get; init; } = string.Empty;

    public string Particular { get; init; } = string.Empty;

    public string DrDisplay { get; init; } = string.Empty;

    public string CrDisplay { get; init; } = string.Empty;

    public string ManualNo { get; init; } = string.Empty;

    public bool IsOpening => string.Equals(RowType, "opening", StringComparison.OrdinalIgnoreCase);

    public bool IsTotal => string.Equals(RowType, "total", StringComparison.OrdinalIgnoreCase);

    public bool IsClosing => string.Equals(RowType, "closing", StringComparison.OrdinalIgnoreCase);

    public bool IsSpecial => IsOpening || IsTotal || IsClosing;
}
