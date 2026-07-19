namespace IMS.Models;

public sealed class DashboardBarChartData
{
    public string Title { get; init; } = string.Empty;
    public string Series1Name { get; init; } = "Series 1";
    public string Series2Name { get; init; } = "Series 2";
    public string Series1Color { get; init; } = "#006B9E";
    public string Series2Color { get; init; } = "#B8860B";
    public IReadOnlyList<string> Labels { get; init; } = [];
    public IReadOnlyList<double> Series1Values { get; init; } = [];
    public IReadOnlyList<double> Series2Values { get; init; } = [];
}

public sealed class DashboardPieChartData
{
    public string Title { get; init; } = string.Empty;
    public IReadOnlyList<DashboardPieSlice> Slices { get; init; } = [];
}

public sealed class DashboardPieSlice
{
    public string Label { get; init; } = string.Empty;
    public double Value { get; init; }
    public string Color { get; init; } = "#006B9E";
}
