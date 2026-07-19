using System;
using System.Windows;
using System.Windows.Controls.Primitives;

namespace IMS.Views.Controls;

/// <summary>
/// Uniform grid that picks column count from available width (mobile 1, tablet 2, desktop 4).
/// </summary>
public class ResponsiveUniformGrid : UniformGrid
{
    public static readonly DependencyProperty DesktopMinWidthProperty =
        DependencyProperty.Register(
            nameof(DesktopMinWidth),
            typeof(double),
            typeof(ResponsiveUniformGrid),
            new FrameworkPropertyMetadata(1000d, FrameworkPropertyMetadataOptions.AffectsMeasure, OnBreakpointChanged));

    public static readonly DependencyProperty TabletMinWidthProperty =
        DependencyProperty.Register(
            nameof(TabletMinWidth),
            typeof(double),
            typeof(ResponsiveUniformGrid),
            new FrameworkPropertyMetadata(560d, FrameworkPropertyMetadataOptions.AffectsMeasure, OnBreakpointChanged));

    public static readonly DependencyProperty DesktopColumnsProperty =
        DependencyProperty.Register(
            nameof(DesktopColumns),
            typeof(int),
            typeof(ResponsiveUniformGrid),
            new FrameworkPropertyMetadata(4, FrameworkPropertyMetadataOptions.AffectsMeasure, OnBreakpointChanged));

    public static readonly DependencyProperty TabletColumnsProperty =
        DependencyProperty.Register(
            nameof(TabletColumns),
            typeof(int),
            typeof(ResponsiveUniformGrid),
            new FrameworkPropertyMetadata(2, FrameworkPropertyMetadataOptions.AffectsMeasure, OnBreakpointChanged));

    public static readonly DependencyProperty MobileColumnsProperty =
        DependencyProperty.Register(
            nameof(MobileColumns),
            typeof(int),
            typeof(ResponsiveUniformGrid),
            new FrameworkPropertyMetadata(1, FrameworkPropertyMetadataOptions.AffectsMeasure, OnBreakpointChanged));

    public double DesktopMinWidth
    {
        get => (double)GetValue(DesktopMinWidthProperty);
        set => SetValue(DesktopMinWidthProperty, value);
    }

    public double TabletMinWidth
    {
        get => (double)GetValue(TabletMinWidthProperty);
        set => SetValue(TabletMinWidthProperty, value);
    }

    public int DesktopColumns
    {
        get => (int)GetValue(DesktopColumnsProperty);
        set => SetValue(DesktopColumnsProperty, value);
    }

    public int TabletColumns
    {
        get => (int)GetValue(TabletColumnsProperty);
        set => SetValue(TabletColumnsProperty, value);
    }

    public int MobileColumns
    {
        get => (int)GetValue(MobileColumnsProperty);
        set => SetValue(MobileColumnsProperty, value);
    }

    static ResponsiveUniformGrid()
    {
        RowsProperty.OverrideMetadata(
            typeof(ResponsiveUniformGrid),
            new FrameworkPropertyMetadata(0, FrameworkPropertyMetadataOptions.AffectsMeasure));
    }

    public ResponsiveUniformGrid()
    {
        Loaded += (_, _) => ApplyColumns(ActualWidth);
        SizeChanged += (_, e) => ApplyColumns(e.NewSize.Width);
    }

    private static void OnBreakpointChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is ResponsiveUniformGrid grid)
            grid.ApplyColumns(grid.ActualWidth);
    }

    private void ApplyColumns(double width)
    {
        var next = ResolveColumns(width);
        if (Columns == next)
            return;

        Columns = next;
        InvalidateMeasure();
    }

    private int ResolveColumns(double width)
    {
        if (width <= 0 || double.IsNaN(width))
            return Math.Max(1, DesktopColumns);

        if (width >= DesktopMinWidth)
            return Math.Max(1, DesktopColumns);

        if (width >= TabletMinWidth)
            return Math.Max(1, TabletColumns);

        return Math.Max(1, MobileColumns);
    }
}
