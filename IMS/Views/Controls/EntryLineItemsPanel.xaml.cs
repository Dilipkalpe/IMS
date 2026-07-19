using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;

namespace IMS.Views.Controls;

public partial class EntryLineItemsPanel : UserControl
{
    public EntryLineItemsPanel()
    {
        InitializeComponent();
        Loaded += (_, _) => ProductScanPicker.FocusScanBox();
    }

    public void FocusScanBox() => ProductScanPicker.FocusScanBox();

    private void LineItemsGrid_OnPreviewMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        var cell = FindParent<DataGridCell>(e.OriginalSource as DependencyObject);
        if (cell is null || cell.IsReadOnly || cell.IsEditing)
            return;

        cell.Focus();
        Dispatcher.BeginInvoke(() =>
        {
            if (!cell.IsEditing)
                LineItemsGrid.BeginEdit(e);
        }, DispatcherPriority.Input);
    }

    private void LineItemsGrid_OnPreviewKeyDown(object sender, KeyEventArgs e)
    {
        if (!LineItemsGrid.CurrentCell.IsValid)
            return;

        var column = LineItemsGrid.CurrentCell.Column;
        if (column is null or DataGridTemplateColumn { IsReadOnly: true } or { IsReadOnly: true })
            return;

        if (!IsEditKey(e.Key))
            return;

        LineItemsGrid.BeginEdit(e);
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
}
