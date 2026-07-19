using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Shapes;
using IMS.Helpers;
using IMS.Models;

namespace IMS.Views.Controls;

public partial class DashboardDonutChart : UserControl
{
    public static readonly DependencyProperty ChartProperty =
        DependencyProperty.Register(nameof(Chart), typeof(DashboardPieChartData), typeof(DashboardDonutChart),
            new PropertyMetadata(null, OnChartChanged));

    public DashboardDonutChart()
    {
        InitializeComponent();
        Loaded += (_, _) => Redraw();
    }

    public DashboardPieChartData? Chart
    {
        get => (DashboardPieChartData?)GetValue(ChartProperty);
        set => SetValue(ChartProperty, value);
    }

    private static void OnChartChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is DashboardDonutChart chart)
            chart.Redraw();
    }

    protected override void OnRenderSizeChanged(SizeChangedInfo sizeInfo)
    {
        base.OnRenderSizeChanged(sizeInfo);
        Redraw();
    }

    private void Redraw()
    {
        if (!IsLoaded || PlotCanvas is null || LegendPanel is null || TitleText is null)
            return;

        PlotCanvas.Children.Clear();
        LegendPanel.Children.Clear();

        var data = Chart;
        TitleText.Text = data?.Title ?? string.Empty;
        if (data is null || data.Slices.Count == 0)
            return;

        var total = data.Slices.Sum(s => s.Value);
        if (total <= 0)
            total = 1;

        foreach (var slice in data.Slices)
        {
            var row = new Grid { Margin = new Thickness(0, 0, 0, 4) };
            row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            row.Children.Add(new Border
            {
                Width = 8,
                Height = 8,
                CornerRadius = new CornerRadius(2),
                Background = ColorHelper.BrushFromHex(slice.Color),
                Margin = new Thickness(0, 0, 6, 0),
                VerticalAlignment = VerticalAlignment.Center
            });
            var label = new TextBlock
            {
                Text = slice.Label,
                FontSize = 9,
                TextTrimming = TextTrimming.CharacterEllipsis,
                MaxWidth = 90
            };
            Grid.SetColumn(label, 1);
            row.Children.Add(label);
            LegendPanel.Children.Add(row);
        }

        var size = Math.Min(Math.Max(PlotCanvas.ActualWidth, 40), Math.Max(PlotCanvas.ActualHeight, 40));
        if (size <= 0)
            return;

        var cx = size / 2;
        var cy = size / 2;
        var outerR = size / 2 - 4;
        var innerR = outerR * 0.55;
        var startAngle = -90.0;

        foreach (var slice in data.Slices)
        {
            var sweep = slice.Value / total * 360.0;
            if (sweep <= 0) continue;
            var path = CreateDonutSegment(cx, cy, outerR, innerR, startAngle, sweep, slice.Color);
            path.ToolTip = $"{slice.Label}: {slice.Value:N0}";
            PlotCanvas.Children.Add(path);
            startAngle += sweep;
        }
    }

    private static Path CreateDonutSegment(double cx, double cy, double outerR, double innerR, double startDeg, double sweepDeg, string color)
    {
        var start = DegreesToRadians(startDeg);
        var end = DegreesToRadians(startDeg + sweepDeg);
        var largeArc = sweepDeg > 180;

        var p1 = PointOnCircle(cx, cy, outerR, start);
        var p2 = PointOnCircle(cx, cy, outerR, end);
        var p3 = PointOnCircle(cx, cy, innerR, end);
        var p4 = PointOnCircle(cx, cy, innerR, start);

        var fig = new PathFigure { StartPoint = p1, IsClosed = true };
        fig.Segments.Add(new ArcSegment(p2, new Size(outerR, outerR), 0, largeArc, SweepDirection.Clockwise, true));
        fig.Segments.Add(new LineSegment(p3, true));
        fig.Segments.Add(new ArcSegment(p4, new Size(innerR, innerR), 0, largeArc, SweepDirection.Counterclockwise, true));

        var geometry = new PathGeometry();
        geometry.Figures.Add(fig);
        return new Path
        {
            Fill = ColorHelper.BrushFromHex(color),
            Data = geometry
        };
    }

    private static Point PointOnCircle(double cx, double cy, double r, double radians) =>
        new(cx + r * Math.Cos(radians), cy + r * Math.Sin(radians));

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180.0;
}
