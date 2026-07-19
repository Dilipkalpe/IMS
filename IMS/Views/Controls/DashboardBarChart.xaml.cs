using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Shapes;
using System.Windows.Threading;
using IMS.Helpers;
using IMS.Models;

namespace IMS.Views.Controls;

public partial class DashboardBarChart : UserControl
{
    public static readonly DependencyProperty ChartProperty =
        DependencyProperty.Register(nameof(Chart), typeof(DashboardBarChartData), typeof(DashboardBarChart),
            new PropertyMetadata(null, OnChartChanged));

    public DashboardBarChart()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        if (PlotCanvas is not null)
            PlotCanvas.SizeChanged += (_, _) => Redraw();
        ScheduleRedraw();
    }

    public DashboardBarChartData? Chart
    {
        get => (DashboardBarChartData?)GetValue(ChartProperty);
        set => SetValue(ChartProperty, value);
    }

    private static void OnChartChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is DashboardBarChart chart)
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

        var data = Chart;
        TitleText.Text = data?.Title ?? string.Empty;
        if (data is null || data.Labels.Count == 0)
            return;

        LegendPanel.Children.Add(BuildLegendItem(data.Series1Name, data.Series1Color));
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
        var plotW = width - leftPad - 4;
        var plotH = height - bottomPad - topPad;

        var max = 1.0;
        foreach (var v in data.Series1Values)
            max = Math.Max(max, v);
        foreach (var v in data.Series2Values)
            max = Math.Max(max, v);

        var count = data.Labels.Count;
        var groupW = plotW / count;
        var barW = Math.Max(4, (groupW - 10) / 2);

        for (var i = 0; i < count; i++)
        {
            var cx = leftPad + groupW * i + groupW / 2;
            var v1 = i < data.Series1Values.Count ? data.Series1Values[i] : 0;
            var v2 = i < data.Series2Values.Count ? data.Series2Values[i] : 0;
            var h1 = max > 0 ? v1 / max * plotH : 0;
            var h2 = max > 0 ? v2 / max * plotH : 0;

            var labelText = data.Labels[i];
            AddBar(
                cx - barW - 2,
                topPad + plotH - h1,
                barW,
                h1,
                data.Series1Color,
                $"{data.Series1Name}\n{labelText}: {v1:N0}");
            AddBar(
                cx + 2,
                topPad + plotH - h2,
                barW,
                h2,
                data.Series2Color,
                $"{data.Series2Name}\n{labelText}: {v2:N0}");

            var label = new TextBlock
            {
                Text = data.Labels[i],
                FontSize = 9,
                Foreground = TryFindResource("TextSecondaryBrush") as Brush ?? Brushes.Gray,
                Width = groupW,
                TextAlignment = TextAlignment.Center
            };
            Canvas.SetLeft(label, leftPad + groupW * i);
            Canvas.SetTop(label, topPad + plotH + 4);
            PlotCanvas.Children.Add(label);
        }

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
    }

    private void AddBar(double x, double y, double w, double h, string colorHex, string? toolTip)
    {
        if (h < 1) h = 1;
        var rect = new Rectangle
        {
            Width = w,
            Height = h,
            RadiusX = 2,
            RadiusY = 2,
            Fill = ColorHelper.BrushFromHex(colorHex),
            ToolTip = toolTip
        };
        Canvas.SetLeft(rect, x);
        Canvas.SetTop(rect, y);
        PlotCanvas.Children.Add(rect);
    }

    private static StackPanel BuildLegendItem(string name, string color)
    {
        var panel = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 12, 0) };
        panel.Children.Add(new Border
        {
            Width = 10,
            Height = 10,
            CornerRadius = new CornerRadius(2),
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
}
