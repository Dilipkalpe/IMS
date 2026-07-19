using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using IMS.ViewModels.SubPages;

namespace IMS.Views;

public partial class BillFormatDesignerView : UserControl
{
    private DesignerSectionViewModel? _dragSection;
    private Canvas? _dragCanvas;
    private Point _dragStart;
    private double _dragStartX;
    private double _dragStartY;

    public BillFormatDesignerView()
    {
        InitializeComponent();
        PageViewHost.Attach(this);
        DataContextChanged += (_, _) => Dispatcher.BeginInvoke(ArrangeAllBandCanvases);
    }

    private BillFormatDesignViewModel? Vm => DataContext as BillFormatDesignViewModel;

    private void BandCanvas_OnLoaded(object sender, RoutedEventArgs e)
    {
        if (sender is Canvas canvas)
            ArrangeBandCanvas(canvas);
    }

    private void BandCanvas_OnSizeChanged(object sender, SizeChangedEventArgs e)
    {
        if (sender is Canvas canvas)
            ArrangeBandCanvas(canvas);
    }

    private void ArrangeAllBandCanvases()
    {
        foreach (var canvas in FindVisualChildren<Canvas>(this).Where(c => c.Tag is string))
            ArrangeBandCanvas(canvas);
    }

    private static void ArrangeBandCanvas(Canvas canvas)
    {
        var host = canvas.Children.OfType<ItemsControl>().FirstOrDefault();
        if (host is null || canvas.ActualWidth <= 0 || canvas.ActualHeight <= 0)
            return;

        host.UpdateLayout();
        for (var i = 0; i < host.Items.Count; i++)
        {
            if (host.ItemContainerGenerator.ContainerFromIndex(i) is not ContentPresenter presenter)
                continue;
            if (presenter.Content is not DesignerSectionViewModel section)
                continue;

            var w = canvas.ActualWidth * section.Width / 100.0;
            var h = Math.Max(24, canvas.ActualHeight * section.Height / 100.0);
            presenter.Width = Math.Max(72, w);
            presenter.Height = h;
            Canvas.SetLeft(presenter, canvas.ActualWidth * section.X / 100.0);
            Canvas.SetTop(presenter, canvas.ActualHeight * section.Y / 100.0);
        }
    }

    private static Canvas? FindBandCanvas(DependencyObject start)
    {
        var current = start;
        while (current is not null)
        {
            if (current is Canvas { Tag: string } canvas)
                return canvas;
            current = VisualTreeHelper.GetParent(current);
        }

        return null;
    }

    private void SectionBlock_OnMouseDown(object sender, MouseButtonEventArgs e)
    {
        if (sender is not FrameworkElement fe || fe.Tag is not DesignerSectionViewModel section)
            return;

        _dragCanvas = FindBandCanvas(fe);
        if (_dragCanvas is null)
            return;

        if (Vm is not null)
            Vm.SelectedSection = section;

        _dragSection = section;
        _dragStart = e.GetPosition(_dragCanvas);
        _dragStartX = section.X;
        _dragStartY = section.Y;
        fe.CaptureMouse();
        e.Handled = true;
    }

    private void SectionBlock_OnMouseMove(object sender, MouseEventArgs e)
    {
        if (_dragSection is null || _dragCanvas is null || e.LeftButton != MouseButtonState.Pressed)
            return;

        if (_dragCanvas.ActualWidth <= 0 || _dragCanvas.ActualHeight <= 0)
            return;

        var pos = e.GetPosition(_dragCanvas);
        var dx = (pos.X - _dragStart.X) / _dragCanvas.ActualWidth * 100.0;
        var dy = (pos.Y - _dragStart.Y) / _dragCanvas.ActualHeight * 100.0;
        var x = Math.Clamp(_dragStartX + dx, 0, 95);
        var y = Math.Clamp(_dragStartY + dy, 0, 95);
        Vm?.UpdateSectionPosition(_dragSection.Id, x, y);
        ArrangeBandCanvas(_dragCanvas);
    }

    private void SectionBlock_OnMouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        if (sender is FrameworkElement fe)
            fe.ReleaseMouseCapture();
        _dragSection = null;
        _dragCanvas = null;
    }

    private void OnSectionLostFocus(object sender, RoutedEventArgs e) => ArrangeAllBandCanvases();

    private void OnSectionChanged(object sender, RoutedEventArgs e) => Vm?.NotifyLayoutChanged();

    private void OnColumnChanged(object sender, RoutedEventArgs e) => Vm?.NotifyLayoutChanged();

    private void ExplorerTree_OnMouseDoubleClick(object sender, MouseButtonEventArgs e)
    {
        if (ExplorerTree.SelectedItem is not BillFormatExplorerNodeViewModel node)
            return;
        Vm?.InsertExplorerItem(node);
        Dispatcher.BeginInvoke(ArrangeAllBandCanvases);
    }

    private static IEnumerable<T> FindVisualChildren<T>(DependencyObject parent) where T : DependencyObject
    {
        for (var i = 0; i < VisualTreeHelper.GetChildrenCount(parent); i++)
        {
            var child = VisualTreeHelper.GetChild(parent, i);
            if (child is T match)
                yield return match;
            foreach (var nested in FindVisualChildren<T>(child))
                yield return nested;
        }
    }
}
