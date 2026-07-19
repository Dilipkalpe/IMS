using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Media;
using System.Windows.Shapes;
using System.Windows.Threading;
using IMS.Helpers;
using IMS.Models;

namespace IMS.Views.Controls;

public partial class DashboardLineChart : UserControl
{
    public static readonly DependencyProperty ChartProperty =
        DependencyProperty.Register(nameof(Chart), typeof(DashboardBarChartData), typeof(DashboardLineChart),
            new PropertyMetadata(null, OnChartChanged));

    public DashboardLineChart()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private readonly ToolTip _hoverToolTip = new()
    {
        Placement = PlacementMode.Mouse,
        StaysOpen = true
    };

    private sealed record HoverPoint(
        double X,
        double Y,
        string Label,
        string SeriesName,
        double Value);

    private List<HoverPoint> _hoverPoints = [];

    public DashboardBarChartData? Chart
    {
        get => (DashboardBarChartData?)GetValue(ChartProperty);
        set => SetValue(ChartProperty, value);
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        if (PlotCanvas is not null)
        {
            PlotCanvas.SizeChanged += (_, _) => Redraw();
            PlotCanvas.MouseMove += PlotCanvasOnMouseMove;
            PlotCanvas.MouseLeave += (_, _) => CloseHover();
            PlotCanvas.ToolTip = _hoverToolTip;
        }
        ScheduleRedraw();
    }

    private static void OnChartChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is DashboardLineChart chart)
            chart.ScheduleRedraw();
    }

    private void ScheduleRedraw()
    {
        Redraw();
        if (!IsLoaded)
            return;

        Dispatcher.BeginInvoke(Redraw, DispatcherPriority.Loaded);
        Dispatcher.BeginInvoke(Redraw, DispatcherPriority.Render);
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
        _hoverPoints = [];

        var data = Chart;
        TitleText.Text = data?.Title ?? string.Empty;
        if (data is null || data.Labels.Count == 0)
            return;

        LegendPanel.Children.Add(BuildLegendItem(data.Series1Name, data.Series1Color));
        if (!string.IsNullOrWhiteSpace(data.Series2Name))
            LegendPanel.Children.Add(BuildLegendItem(data.Series2Name, data.Series2Color));

        var width = PlotCanvas.ActualWidth;
        var height = PlotCanvas.ActualHeight;
        if (width < 40 || height < 40)
        {
            width = Math.Max(width, ActualWidth - 16);
            height = Math.Max(height, ActualHeight - 48);
        }

        width = Math.Max(width, 120);
        height = Math.Max(height, 80);

        const double leftPad = 8;
        const double bottomPad = 22;
        const double topPad = 6;
        const double rightPad = 4;
        var plotW = width - leftPad - rightPad;
        var plotH = height - bottomPad - topPad;

        var max = 1.0;
        foreach (var v in data.Series1Values)
            max = Math.Max(max, v);
        foreach (var v in data.Series2Values)
            max = Math.Max(max, v);

        var count = data.Labels.Count;

        var baseline = new Line
        {
            X1 = leftPad,
            Y1 = topPad + plotH,
            X2 = leftPad + plotW,
            Y2 = topPad + plotH,
            Stroke = TryFindResource("BorderBrush") as Brush ?? Brushes.LightGray,
            StrokeThickness = 1
        };
        PlotCanvas.Children.Add(baseline);

        DrawSeries(data.Series1Values, data.Series1Color, count, leftPad, topPad, plotW, plotH, max, data.Series1Name, data.Labels);
        DrawSeries(data.Series2Values, data.Series2Color, count, leftPad, topPad, plotW, plotH, max, data.Series2Name, data.Labels);

        var labelWidth = Math.Max(36, plotW / count);
        for (var i = 0; i < count; i++)
        {
            var cx = GetPointX(i, count, leftPad, plotW);
            var label = new TextBlock
            {
                Text = data.Labels[i],
                FontSize = 9,
                Foreground = TryFindResource("TextSecondaryBrush") as Brush ?? Brushes.Gray,
                Width = labelWidth,
                TextAlignment = TextAlignment.Center
            };
            Canvas.SetLeft(label, cx - labelWidth / 2);
            Canvas.SetTop(label, topPad + plotH + 4);
            PlotCanvas.Children.Add(label);
        }
    }

    private void DrawSeries(
        IReadOnlyList<double> values,
        string colorHex,
        int count,
        double leftPad,
        double topPad,
        double plotW,
        double plotH,
        double max,
        string seriesName,
        IReadOnlyList<string> labels)
    {
        if (count == 0)
            return;

        if (string.IsNullOrWhiteSpace(seriesName))
            return;

        var brush = ColorHelper.BrushFromHex(colorHex);
        var points = new PointCollection();

        for (var i = 0; i < count; i++)
        {
            var x = GetPointX(i, count, leftPad, plotW);
            var value = i < values.Count ? values[i] : 0;
            var y = topPad + plotH - (max > 0 ? value / max * plotH : 0);
            points.Add(new Point(x, y));

            var label = i < labels.Count ? labels[i] : string.Empty;
            _hoverPoints.Add(new HoverPoint(x, y, label, seriesName, value));
        }

        if (points.Count > 1)
        {
            PlotCanvas.Children.Add(new Polyline
            {
                Points = points,
                Stroke = brush,
                StrokeThickness = 2,
                Fill = Brushes.Transparent,
                StrokeLineJoin = PenLineJoin.Round,
                StrokeStartLineCap = PenLineCap.Round,
                StrokeEndLineCap = PenLineCap.Round
            });
        }

        foreach (var point in points)
        {
            var marker = new Ellipse
            {
                Width = 7,
                Height = 7,
                Fill = brush,
                Stroke = Brushes.White,
                StrokeThickness = 1
            };
            Canvas.SetLeft(marker, point.X - 3.5);
            Canvas.SetTop(marker, point.Y - 3.5);
            PlotCanvas.Children.Add(marker);
        }
    }

    private static double GetPointX(int index, int count, double leftPad, double plotW)
    {
        if (count <= 1)
            return leftPad + plotW / 2;

        var step = plotW / (count - 1);
        return leftPad + step * index;
    }

    private static StackPanel BuildLegendItem(string name, string color)
    {
        var panel = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 12, 0) };
        panel.Children.Add(new Border
        {
            Width = 14,
            Height = 3,
            CornerRadius = new CornerRadius(1),
            Background = ColorHelper.BrushFromHex(color),
            Margin = new Thickness(0, 0, 4, 0),
            VerticalAlignment = VerticalAlignment.Center
        });
        panel.Children.Add(new TextBlock
        {
            Text = name,
            FontSize = 10,
            VerticalAlignment = VerticalAlignment.Center
        });
        return panel;
    }

    private void PlotCanvasOnMouseMove(object sender, System.Windows.Input.MouseEventArgs e)
    {
        if (PlotCanvas is null || _hoverPoints.Count == 0)
            return;

        var p = e.GetPosition(PlotCanvas);

        HoverPoint? best = null;
        var bestDist2 = double.MaxValue;
        foreach (var hp in _hoverPoints)
        {
            var dx = hp.X - p.X;
            var dy = hp.Y - p.Y;
            var d2 = dx * dx + dy * dy;
            if (d2 < bestDist2)
            {
                bestDist2 = d2;
                best = hp;
            }
        }

        // ~12px radius hit target
        if (best is null || bestDist2 > 12 * 12)
        {
            CloseHover();
            return;
        }

        _hoverToolTip.Content = $"{best.SeriesName}\n{best.Label}: {best.Value:N0}";
        _hoverToolTip.IsOpen = true;
    }

    private void CloseHover()
    {
        _hoverToolTip.IsOpen = false;
    }
}
