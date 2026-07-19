namespace IMS.Models;

public sealed class MockRow
{
    /// <summary>1-based row number across all pages (set when displayed in a paged list).</summary>
    public int RowNumber { get; set; }

    public required string Col1 { get; init; }
    public required string Col2 { get; init; }
    public required string Col3 { get; init; }
    public required string Col4 { get; init; }
    public string Col5 { get; init; } = "—";
    public string? Status { get; init; }

    /// <summary>Original API entity when the row was built from live data.</summary>
    public object? Source { get; init; }
}
