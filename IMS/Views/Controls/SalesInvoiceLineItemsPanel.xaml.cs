using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;
using IMS.Helpers;
using IMS.Services;
using IMS.ViewModels.SubPages;

namespace IMS.Views.Controls;

public partial class SalesInvoiceLineItemsPanel : UserControl
{
    public SalesInvoiceLineItemsPanel()
    {
        InitializeComponent();
        FormKeyboardNavigation.SetSuppressEnterAsTab(BarcodeProductBox, true);
        Loaded += OnLoaded;
        SalesLineGridColumnApplier.Wire(LineItemsGrid, () => LineGridColumnContext.From(DataContext));
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        var context = LineGridColumnContext.From(DataContext);
        if (context is not null)
        {
            await GridColumnPreferenceService.LoadVisibleKeysAsync(context.ModuleKey);
            SalesLineGridColumnApplier.Apply(LineItemsGrid, context);
        }

        FocusScanBox();
    }

    public void FocusScanBox()
    {
        if (!IsLoaded)
            return;
        BarcodeProductBox.Focus();
        BarcodeProductBox.SelectAll();
    }

    private async void ProductComboBox_OnDropDownOpened(object sender, EventArgs e)
    {
        switch (DataContext)
        {
            case SalesEntryFormViewModelBase sales when sales.ShowProductPicker:
                await sales.RefreshProductSearchAsync();
                break;
            case PurchaseEntryFormViewModelBase purchase when purchase.ShowProductPicker:
                await purchase.RefreshProductSearchAsync();
                break;
        }
    }

    private void BarcodeProductBox_OnPreviewKeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key is not Key.Enter and not Key.Return)
            return;

        switch (DataContext)
        {
            case SalesEntryFormViewModelBase salesVm:
                salesVm.AddLineFromScan();
                break;
            case PurchaseEntryFormViewModelBase purchaseVm:
                purchaseVm.AddLineFromScan();
                break;
        }

        e.Handled = true;
        Dispatcher.BeginInvoke(FocusScanBox, DispatcherPriority.Input);
    }

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
        if (column is null or { IsReadOnly: true })
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
