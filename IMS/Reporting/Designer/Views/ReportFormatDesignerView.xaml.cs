using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using IMS.Reporting.Engine;
using IMS.Reporting.Data;
using IMS.Reporting.Designer.ViewModels;
using IMS.Reporting.Engine;
using IMS.Views;

namespace IMS.Reporting.Designer.Views;

public partial class ReportFormatDesignerView : UserControl
{
    private ReportFormatDesignerViewModel? _vm;
    private DesignElementViewModel? _dragElement;
    private Point _dragStart;
    private double _dragStartX;
    private double _dragStartY;

    public ReportFormatDesignerView()
    {
        InitializeComponent();
        PageViewHost.Attach(this);
        DataContextChanged += OnDataContextChanged;
        Loaded += (_, _) => RebuildCanvas();
    }

    private void OnDataContextChanged(object sender, DependencyPropertyChangedEventArgs e)
    {
        if (e.OldValue is ReportFormatDesignerViewModel oldVm)
        {
            oldVm.LayoutElementsChanged -= RebuildCanvas;
            oldVm.CanvasPageSizeChanged -= OnCanvasPageSizeChanged;
            oldVm.PropertyChanged -= OnVmPropertyChanged;
        }

        if (e.NewValue is ReportFormatDesignerViewModel newVm)
        {
            newVm.LayoutElementsChanged += RebuildCanvas;
            newVm.CanvasPageSizeChanged += OnCanvasPageSizeChanged;
            newVm.PropertyChanged += OnVmPropertyChanged;
        }

        RebuildCanvas();
    }

    private ReportFormatDesignerViewModel? Vm =>
        DataContext as ReportFormatDesignerViewModel;

    private void RebuildCanvas()
    {
        _vm = Vm;
        if (_vm is null)
            return;

        DesignCanvas.Children.Clear();
        foreach (var el in _vm.Elements)
        {
            var border = CreateElementChrome(el, Element_OnMouseLeftButtonDown);
            DesignCanvas.Children.Add(border);
            PositionChrome(border, el);
        }

        if (ZoomHost is not null)
            ZoomHost.LayoutTransform = new ScaleTransform(_vm.Zoom, _vm.Zoom);
    }

    private void OnCanvasPageSizeChanged() => RebuildCanvas();

    private void OnVmPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName is nameof(ReportFormatDesignerViewModel.Zoom)
            or nameof(ReportFormatDesignerViewModel.DesignCanvasWidth)
            or nameof(ReportFormatDesignerViewModel.DesignCanvasHeight))
            RebuildCanvas();
    }

    private static Border CreateElementChrome(
        DesignElementViewModel el,
        Action<Border, MouseButtonEventArgs> onMouseDown)
    {
        var bg = ReportLayoutUnits.ParseBrush(el.BackgroundColor, new SolidColorBrush(Color.FromRgb(248, 250, 252)));
        var fg = ReportLayoutUnits.ParseBrush(el.TextColor, new SolidColorBrush(Color.FromRgb(15, 23, 42)));

        var border = new Border
        {
            Tag = el,
            BorderBrush = new SolidColorBrush(Color.FromRgb(37, 99, 235)),
            BorderThickness = new Thickness(1),
            Background = bg,
            Padding = new Thickness(4),
            Child = new StackPanel
            {
                Children =
                {
                    new TextBlock
                    {
                        Text = el.Name,
                        FontSize = el.FontSizePt ?? 10,
                        FontWeight = FontWeights.SemiBold,
                        Foreground = fg
                    },
                    new TextBlock
                    {
                        Text = el.Type,
                        FontSize = 9,
                        Foreground = new SolidColorBrush(Color.FromRgb(100, 116, 139))
                    }
                }
            }
        };
        border.MouseLeftButtonDown += (_, e) => onMouseDown(border, e);
        return border;
    }

    private static void PositionChrome(Border border, DesignElementViewModel el)
    {
        Canvas.SetLeft(border, ReportLayoutUnits.MmToDips(el.XMm));
        Canvas.SetTop(border, ReportLayoutUnits.MmToDips(el.YMm));
        border.Width = Math.Max(40, ReportLayoutUnits.MmToDips(el.WidthMm));
        border.Height = Math.Max(20, ReportLayoutUnits.MmToDips(el.HeightMm));
    }

    private void Element_OnMouseLeftButtonDown(Border border, MouseButtonEventArgs e)
    {
        if (border.Tag is not DesignElementViewModel el || _vm is null)
            return;

        _vm.SelectedElement = el;
        _dragElement = el;
        _dragStart = e.GetPosition(DesignCanvas);
        _dragStartX = el.XMm;
        _dragStartY = el.YMm;
        border.CaptureMouse();
        e.Handled = true;
        HighlightSelection();
    }

    private void Canvas_OnMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (_vm is not null)
            _vm.SelectedElement = null;
        HighlightSelection();
    }

    private void Canvas_OnMouseMove(object sender, MouseEventArgs e)
    {
        if (_dragElement is null || e.LeftButton != MouseButtonState.Pressed)
            return;

        var pos = e.GetPosition(DesignCanvas);
        var dx = (pos.X - _dragStart.X) / ReportLayoutUnits.MmToDips(1);
        var dy = (pos.Y - _dragStart.Y) / ReportLayoutUnits.MmToDips(1);
        _dragElement.XMm = Snap(_dragStartX + dx);
        _dragElement.YMm = Snap(_dragStartY + dy);
        _dragElement.ApplyToModel();
        RebuildCanvas();
        _vm!.SelectedElement = _dragElement;
    }

    private void Canvas_OnMouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        if (_dragElement is not null)
            Mouse.Capture(null);
        _dragElement = null;
    }

    private static double Snap(double mm) => Math.Round(mm);

    private void HighlightSelection()
    {
        foreach (var child in DesignCanvas.Children.OfType<Border>())
        {
            if (child.Tag is DesignElementViewModel el)
            {
                child.BorderThickness = new Thickness(el.IsSelected ? 2 : 1);
            }
        }
    }

    private void FieldExplorer_OnDoubleClick(object sender, MouseButtonEventArgs e)
    {
        if (FieldList.SelectedItem is ReportFieldRegistryEntryDto field)
            _vm?.InsertFieldCommand.Execute(field);
        RebuildCanvas();
    }
}
