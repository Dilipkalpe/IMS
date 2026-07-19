namespace IMS.Models;

public sealed class DashboardAlertItem
{
    public string Title { get; init; } = string.Empty;
    public string Detail { get; init; } = string.Empty;
    public string Severity { get; init; } = "Active";
    public string IconGlyph { get; init; } = "\uE946";
}

public sealed class DashboardSummaryLine
{
    public string Label { get; init; } = string.Empty;
    public string Value { get; init; } = string.Empty;
    public string IconGlyph { get; init; } = "\uE8A5";
}
