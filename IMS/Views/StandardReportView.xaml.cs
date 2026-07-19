using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Input;
using System.Windows.Media;
using Microsoft.Win32;
using System.Text;
using System.Reflection;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using IMS.Services;

namespace IMS.Views;

public partial class StandardReportView : UserControl
{
    private DataGrid? _boundGrid;
    private List<ListColumnDef> _allColumns = [];
    private List<string> _defaultVisibleKeys = [];
    public static readonly DependencyProperty FilterContentProperty =
        DependencyProperty.Register(
            nameof(FilterContent),
            typeof(object),
            typeof(StandardReportView),
            new PropertyMetadata(null));

    public static readonly DependencyProperty GridContentProperty =
        DependencyProperty.Register(
            nameof(GridContent),
            typeof(object),
            typeof(StandardReportView),
            new PropertyMetadata(null, OnGridContentChanged));

    public static readonly DependencyProperty FooterContentProperty =
        DependencyProperty.Register(
            nameof(FooterContent),
            typeof(object),
            typeof(StandardReportView),
            new PropertyMetadata(null));

    public StandardReportView()
    {
        InitializeComponent();
        Loaded += (_, _) => RefreshColumnMeta();
        Unloaded += (_, _) => CloseExportMenu();
    }

    public object? FilterContent
    {
        get => GetValue(FilterContentProperty);
        set => SetValue(FilterContentProperty, value);
    }

    public object? GridContent
    {
        get => GetValue(GridContentProperty);
        set => SetValue(GridContentProperty, value);
    }

    public object? FooterContent
    {
        get => GetValue(FooterContentProperty);
        set => SetValue(FooterContentProperty, value);
    }

    private static void OnGridContentChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is not StandardReportView view)
            return;

        if (e.NewValue is DataGrid grid)
            view.AttachGrid(grid);
    }

    private void AttachGrid(DataGrid grid)
    {
        _boundGrid = grid;
        GridHost.Content = grid;
        grid.MinRowHeight = 42;
        grid.ColumnHeaderHeight = 44;
        if (grid.Style is null)
            grid.Style = (Style)FindResource("SoListOrdersGrid");
        if (grid.ColumnHeaderStyle is null)
            grid.ColumnHeaderStyle = (Style)FindResource("SoListColumnHeader");
        if (grid.CellStyle is null)
            grid.CellStyle = (Style)FindResource("SoListDataGridCell");
        RefreshColumnMeta();
    }

    private void ManageColumnsButton_OnClick(object sender, RoutedEventArgs e)
    {
        if (_boundGrid is null)
            return;

        RefreshColumnMeta();
        var currentVisible = _allColumns
            .Where(c => _boundGrid.Columns.Any(gc =>
                string.Equals(GetGridColumnKey(gc), c.Key, StringComparison.OrdinalIgnoreCase)
                && gc.Visibility == Visibility.Visible))
            .Select(c => c.Key)
            .ToList();
        var moduleKey = BuildModuleKey();
        var window = new ListColumnSettingsWindow(moduleKey, _allColumns, currentVisible, _defaultVisibleKeys)
        {
            Owner = Window.GetWindow(this)
        };
        if (window.ShowDialog() == true && window.ResultKeys is { Count: > 0 } keys)
        {
            var allowed = new HashSet<string>(keys, StringComparer.OrdinalIgnoreCase);
            foreach (var col in _boundGrid.Columns)
                col.Visibility = allowed.Contains(GetGridColumnKey(col)) ? Visibility.Visible : Visibility.Collapsed;
        }
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

    private void OnExportExcelClick(object sender, MouseButtonEventArgs e)
    {
        e.Handled = true;
        CloseExportMenu();
        ExportToCsv();
    }

    private void OnExportPdfClick(object sender, MouseButtonEventArgs e)
    {
        e.Handled = true;
        CloseExportMenu();
        ShowPrintDialog();
    }

    private void OnExportPrintClick(object sender, MouseButtonEventArgs e)
    {
        e.Handled = true;
        CloseExportMenu();
        ShowPrintDialog();
    }

    private void ShowPrintDialog()
    {
        if (_boundGrid is null)
            return;

        var printDialog = new PrintDialog();
        if (printDialog.ShowDialog() == true)
            printDialog.PrintVisual(_boundGrid, DataContext?.GetType().Name ?? "Report Print");
    }

    private void ExportToCsv()
    {
        if (_boundGrid?.ItemsSource is null)
            return;

        var visibleColumns = _boundGrid.Columns
            .Where(c => c.Visibility == Visibility.Visible)
            .OrderBy(c => c.DisplayIndex)
            .ToList();
        if (visibleColumns.Count == 0)
            return;

        var dialog = new SaveFileDialog
        {
            Filter = "CSV files (*.csv)|*.csv|All files (*.*)|*.*",
            FileName = $"{SanitizeFileName(DataContext?.GetType().Name ?? "Report")}_{DateTime.Now:yyyyMMdd_HHmmss}.csv"
        };
        if (dialog.ShowDialog() != true)
            return;

        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",", visibleColumns.Select(c => EscapeCsv(c.Header?.ToString() ?? string.Empty))));

        foreach (var item in _boundGrid.ItemsSource)
        {
            if (item is null) continue;
            var values = new List<string>(visibleColumns.Count);
            foreach (var col in visibleColumns)
            {
                values.Add(EscapeCsv(GetColumnValue(item, col)));
            }
            sb.AppendLine(string.Join(",", values));
        }

        File.WriteAllText(dialog.FileName, sb.ToString(), Encoding.UTF8);
        MessageBox.Show("Data exported successfully.", "Export Data", MessageBoxButton.OK, MessageBoxImage.Information);
    }

    private void RefreshColumnMeta()
    {
        if (_boundGrid is null)
            return;

        _allColumns = _boundGrid.Columns
            .OrderBy(c => c.DisplayIndex)
            .Select((c, idx) => new ListColumnDef(
                GetGridColumnKey(c, idx),
                c.Header?.ToString() ?? $"Column {idx + 1}",
                false))
            .ToList();
        _defaultVisibleKeys = _allColumns.Select(c => c.Key).ToList();

        var moduleKey = BuildModuleKey();
        var saved = ListColumnPreferenceStore.Load(moduleKey, _allColumns, _defaultVisibleKeys);
        var visibleSet = new HashSet<string>(saved, StringComparer.OrdinalIgnoreCase);
        foreach (var c in _boundGrid.Columns)
            c.Visibility = visibleSet.Contains(GetGridColumnKey(c)) ? Visibility.Visible : Visibility.Collapsed;
    }

    private string BuildModuleKey() =>
        $"{DataContext?.GetType().Name ?? "report"}-report-grid";

    private static string GetGridColumnKey(DataGridColumn column, int? index = null)
    {
        if (column is DataGridBoundColumn bound && bound.Binding is Binding binding && binding.Path is { Path: { Length: > 0 } path })
            return path;
        var header = column.Header?.ToString();
        if (!string.IsNullOrWhiteSpace(header))
            return header.Trim().Replace(" ", "-", StringComparison.OrdinalIgnoreCase).ToLowerInvariant();
        return $"col-{index ?? column.DisplayIndex}";
    }

    private static string GetColumnValue(object item, DataGridColumn column)
    {
        if (column is DataGridBoundColumn bound && bound.Binding is Binding binding && binding.Path is not null)
        {
            return ResolvePropertyPath(item, binding.Path.Path);
        }

        return string.Empty;
    }

    private static string ResolvePropertyPath(object source, string path)
    {
        object? current = source;
        foreach (var part in path.Split('.'))
        {
            if (current is null) return string.Empty;
            var prop = current.GetType().GetProperty(part, BindingFlags.Instance | BindingFlags.Public | BindingFlags.IgnoreCase);
            if (prop is null) return string.Empty;
            current = prop.GetValue(current);
        }
        return current?.ToString() ?? string.Empty;
    }

    private static string EscapeCsv(string value)
    {
        if (value.Contains('"'))
            value = value.Replace("\"", "\"\"");
        return value.IndexOfAny([',', '"', '\n', '\r']) >= 0 ? $"\"{value}\"" : value;
    }

    private static string SanitizeFileName(string value)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var chars = value.Select(ch => invalid.Contains(ch) ? '_' : ch).ToArray();
        return new string(chars);
    }
}
