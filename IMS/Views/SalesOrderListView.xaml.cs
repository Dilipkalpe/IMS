using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Media;
using IMS.ViewModels;

namespace IMS.Views;

public partial class SalesOrderListView : UserControl
{
    public SalesOrderListView()
    {
        InitializeComponent();
        PageViewHost.Attach(this);
        DataContextChanged += (_, _) => HookViewModel();
        Loaded += OnLoaded;
        Unloaded += OnUnloaded;
        SizeChanged += (_, _) => SyncGridHeight();
        OrdersGrid.PreviewMouseLeftButtonUp += OnOrdersGridPreviewMouseLeftButtonUp;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        ApplyColumnVisibility();
        SyncGridHeight();
    }

    private void OnUnloaded(object sender, RoutedEventArgs e) => CloseExportMenu();

    private void SyncGridHeight()
    {
        if (OrdersGrid.Parent is not Grid host)
            return;

        host.UpdateLayout();

        var paginationHeight = 0d;
        foreach (UIElement child in host.Children)
        {
            if (Grid.GetRow(child) != 1 || child is not FrameworkElement footer)
                continue;
            footer.UpdateLayout();
            paginationHeight = Math.Max(paginationHeight, footer.ActualHeight);
        }

        var available = host.ActualHeight - paginationHeight;
        if (available > 80 && !double.IsNaN(available) && !double.IsInfinity(available))
            OrdersGrid.MaxHeight = available;
        else
            OrdersGrid.ClearValue(DataGrid.MaxHeightProperty);
    }

    private void HookViewModel()
    {
        if (DataContext is SalesOrdersViewModel vm)
        {
            vm.ColumnVisibilityChanged -= OnColumnVisibilityChanged;
            vm.ColumnVisibilityChanged += OnColumnVisibilityChanged;
        }
    }

    private void OnColumnVisibilityChanged(object? sender, EventArgs e) => ApplyColumnVisibility();

    private void ApplyColumnVisibility()
    {
        if (DataContext is not SalesOrdersViewModel vm)
            return;

        SetVisible(ColSoNo, vm.ShowColumnSoNo);
        SetVisible(ColSoDate, vm.ShowColumnSoDate);
        SetVisible(ColCustomer, vm.ShowColumnCustomer);
        SetVisible(ColTotalTaxable, vm.ShowColumnTotalTaxable);
        SetVisible(ColTotalCgst, vm.ShowColumnTotalCgst);
        SetVisible(ColTotalSgst, vm.ShowColumnTotalSgst);
        SetVisible(ColTotalIgst, vm.ShowColumnTotalIgst);
        SetVisible(ColTotalDiscount, vm.ShowColumnTotalDiscount);
        SetVisible(ColSalesAmt, vm.ShowColumnSalesAmt);
        SetVisible(ColPaidAmt, vm.ShowColumnPaidAmt);
        SetVisible(ColBalance, vm.ShowColumnBalance);
        SetVisible(ColStatus, vm.ShowColumnStatus);
    }

    private static void SetVisible(DataGridColumn column, bool visible) =>
        column.Visibility = visible ? Visibility.Visible : Visibility.Collapsed;

    private SalesOrdersViewModel? GetViewModel() =>
        DataContext as SalesOrdersViewModel;

    private void OnOrdersGridPreviewMouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        if (FindParent<Button>(e.OriginalSource as DependencyObject) is not null)
            return;

        if (FindParent<DataGridColumnHeader>(e.OriginalSource as DependencyObject) is not { Column: { } column })
            return;

        var field = ResolveSortField(column);
        if (field is null || GetViewModel() is not { } vm)
            return;

        vm.ApplySort(field);
        e.Handled = true;
    }

    private string? ResolveSortField(DataGridColumn column)
    {
        if (ReferenceEquals(column, ColSr))
            return "sr";
        if (ReferenceEquals(column, ColSoNo))
            return "soNo";
        if (ReferenceEquals(column, ColSoDate))
            return "soDate";
        if (ReferenceEquals(column, ColCustomer))
            return "customer";
        if (ReferenceEquals(column, ColTotalTaxable))
            return "totalTaxable";
        if (ReferenceEquals(column, ColTotalCgst))
            return "totalCgst";
        if (ReferenceEquals(column, ColTotalSgst))
            return "totalSgst";
        if (ReferenceEquals(column, ColTotalIgst))
            return "totalIgst";
        if (ReferenceEquals(column, ColTotalDiscount))
            return "totalDiscount";
        if (ReferenceEquals(column, ColSalesAmt))
            return "salesAmt";
        if (ReferenceEquals(column, ColPaidAmt))
            return "paidAmt";
        if (ReferenceEquals(column, ColBalance))
            return "balance";
        if (ReferenceEquals(column, ColStatus))
            return "status";
        return null;
    }

    private static T? FindParent<T>(DependencyObject? child) where T : DependencyObject
    {
        while (child != null)
        {
            if (child is T match)
                return match;
            child = VisualTreeHelper.GetParent(child);
        }

        return null;
    }

    private void OnExportDataClick(object sender, RoutedEventArgs e)
    {
        if (ExportDataPopup.IsOpen)
        {
            CloseExportMenu();
            return;
        }

        ExportDataPopup.PlacementTarget = ExportDataButton;
        ExportDataPopup.IsOpen = true;
        if (Application.Current.MainWindow is { } window)
            window.PreviewMouseDown += OnWindowPreviewMouseDown;
        e.Handled = true;
    }

    private void OnWindowPreviewMouseDown(object sender, MouseButtonEventArgs e)
    {
        if (!ExportDataPopup.IsOpen)
            return;

        if (e.OriginalSource is DependencyObject source && IsWithinExportUi(source))
            return;

        CloseExportMenu();
    }

    private bool IsWithinExportUi(DependencyObject source)
    {
        while (source != null)
        {
            if (ReferenceEquals(source, ExportDataButton) || ReferenceEquals(source, ExportDataMenuHost))
                return true;
            source = VisualTreeHelper.GetParent(source);
        }

        return false;
    }

    private void CloseExportMenu()
    {
        ExportDataPopup.IsOpen = false;
        if (Application.Current.MainWindow is { } window)
            window.PreviewMouseDown -= OnWindowPreviewMouseDown;
    }

    private async void OnExportExcelClick(object sender, MouseButtonEventArgs e)
    {
        e.Handled = true;
        CloseExportMenu();
        if (GetViewModel() is { } vm)
            await vm.ExportDataAsync("excel");
    }

    private async void OnExportPdfClick(object sender, MouseButtonEventArgs e)
    {
        e.Handled = true;
        CloseExportMenu();
        if (GetViewModel() is { } vm)
            await vm.ExportDataAsync("pdf");
    }

    private async void OnExportPrintClick(object sender, MouseButtonEventArgs e)
    {
        e.Handled = true;
        CloseExportMenu();
        if (GetViewModel() is { } vm)
            await vm.ExportDataAsync("print");
    }
}
