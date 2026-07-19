using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;

namespace IMS.Views;

public partial class StockTransferView : UserControl
{
    private DataGrid? _lineItemsGrid;

    public StockTransferView()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        _lineItemsGrid = FindChild<DataGrid>(this);
        if (_lineItemsGrid is null)
            return;

        _lineItemsGrid.PreviewMouseLeftButtonDown += LineItemsGrid_OnPreviewMouseLeftButtonDown;
        _lineItemsGrid.PreviewKeyDown += LineItemsGrid_OnPreviewKeyDown;
        FocusScanBox();
    }

    public void FocusScanBox()
    {
        if (!IsLoaded)
            return;

        var box = FindChild<TextBox>(this, static tb =>
            tb.GetBindingExpression(TextBox.TextProperty)?.ParentBinding?.Path.Path == "BarcodeOrProduct");
        box?.Focus();
        box?.SelectAll();
    }

    private void LineItemsGrid_OnPreviewMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (_lineItemsGrid is null)
            return;

        var cell = FindParent<DataGridCell>(e.OriginalSource as DependencyObject);
        if (cell is null || cell.IsReadOnly || cell.IsEditing)
            return;

        cell.Focus();
        Dispatcher.BeginInvoke(() =>
        {
            if (!cell.IsEditing)
                _lineItemsGrid.BeginEdit(e);
        }, DispatcherPriority.Input);
    }

    private void LineItemsGrid_OnPreviewKeyDown(object sender, KeyEventArgs e)
    {
        if (_lineItemsGrid is null || !_lineItemsGrid.CurrentCell.IsValid)
            return;

        var column = _lineItemsGrid.CurrentCell.Column;
        if (column is null or DataGridTemplateColumn { IsReadOnly: true } or { IsReadOnly: true })
            return;

        if (!IsEditKey(e.Key))
            return;

        _lineItemsGrid.BeginEdit(e);
    }

    private static bool IsEditKey(Key key) =>
        key is >= Key.D0 and <= Key.D9
            or >= Key.NumPad0 and <= Key.NumPad9
            or Key.OemPeriod or Key.OemComma or Key.Decimal or Key.Subtract or Key.OemMinus
            or Key.Back or Key.Delete;

    private static T? FindParent<T>(DependencyObject? child) where T : DependencyObject
    {
        while (child is not null)
        {
            if (child is T match)
                return match;
            child = VisualTreeHelper.GetParent(child);
        }

        return null;
    }

    private static T? FindChild<T>(DependencyObject parent, Func<T, bool>? predicate = null) where T : class
    {
        var count = VisualTreeHelper.GetChildrenCount(parent);
        for (var i = 0; i < count; i++)
        {
            var child = VisualTreeHelper.GetChild(parent, i);
            if (child is T match && (predicate is null || predicate(match)))
                return match;
            var nested = FindChild(child, predicate);
            if (nested is not null)
                return nested;
        }

        return null;
    }
}
