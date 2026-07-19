namespace IMS.Models;

public sealed class MasterPickRow
{
    public int RowNumber { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Detail { get; set; }
}
