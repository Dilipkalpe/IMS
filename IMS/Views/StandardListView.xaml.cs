using System.Windows;

using System.Windows.Controls;

using System.Windows.Controls.Primitives;

using System.Windows.Data;

using System.Windows.Input;

using System.Windows.Media;

using IMS.Converters;

using IMS.Models;

using IMS.Services;

using IMS.ViewModels;



namespace IMS.Views;



public partial class StandardListView : UserControl

{

    public StandardListView()

    {

        InitializeComponent();

        PageViewHost.Attach(this);

        DataContextChanged += (_, _) => HookViewModel();

        Loaded += OnLoaded;

        Unloaded += OnUnloaded;

        SizeChanged += (_, _) => SyncGridHeight();

        ListGrid.PreviewMouseLeftButtonUp += OnGridHeaderClick;
        ListGrid.SelectionChanged += OnGridSelectionChanged;

    }



    private IStandardListViewModel? Vm => DataContext as IStandardListViewModel;



    private void OnLoaded(object sender, RoutedEventArgs e)

    {

        RebuildColumns();

        SyncGridHeight();

    }



    private void OnUnloaded(object sender, RoutedEventArgs e) => CloseExportMenu();



    private void HookViewModel()

    {

        if (Vm is not { } vm)

            return;

        vm.ColumnVisibilityChanged -= OnColumnVisibilityChanged;

        vm.ColumnVisibilityChanged += OnColumnVisibilityChanged;

        RebuildColumns();
        SyncSelectedRowFromGrid();

    }

    private void OnGridSelectionChanged(object sender, SelectionChangedEventArgs e) =>
        SyncSelectedRowFromGrid();

    private void ListGrid_OnMouseDoubleClick(object sender, MouseButtonEventArgs e)
    {
        if (DataContext is not MockPageViewModel mockPage
            || mockPage.DesignRowCommand is not { } designCmd
            || !mockPage.ShowDesignLayoutAction)
            return;

        if (ListGrid.SelectedItem is not StandardListRow gridRow || gridRow.Tag is not MockRow row)
            return;

        if (designCmd.CanExecute(row))
            designCmd.Execute(row);
    }

    private void SyncSelectedRowFromGrid()
    {
        if (DataContext is not MockPageViewModel mockPage)
            return;

        mockPage.SelectedRow = ListGrid.SelectedItem is StandardListRow gridRow && gridRow.Tag is MockRow row
            ? row
            : null;
    }



    private void OnColumnVisibilityChanged(object? sender, EventArgs e) => RebuildColumns();



    private void RebuildColumns()

    {

        if (Vm is not { } vm)

            return;



        ListGrid.Columns.Clear();



        var srCol = new DataGridTextColumn

        {

            Header = CreateSortHeader(new ListColumnDef("sr", "Sr.", true), centerHeader: true),

            Binding = new Binding(nameof(Models.StandardListRow.SerialNo)),

            Width = 52,

            IsReadOnly = true,

            HeaderStyle = (Style)ResolveResource("SoListSortableColumnHeader")

        };

        srCol.ElementStyle = CreateCellStyle(center: true, noWrap: true);

        ListGrid.Columns.Add(srCol);



        if (vm.ShowEditAction || vm.ShowDeleteAction || vm.ShowPrintAction || vm.ShowViewAction
            || vm.ShowBomAction || vm.ShowBarcodeLabelAction || vm.ShowDesignLayoutAction)

        {

            var extraActions = (vm.ShowBomAction ? 1 : 0) + (vm.ShowBarcodeLabelAction ? 1 : 0);
            var actionWidth = extraActions switch
            {
                >= 2 => 200,
                1 => 168,
                _ => 128
            };
            var actionMinWidth = extraActions switch
            {
                >= 2 => 180,
                1 => 150,
                _ => 110
            };

            var actions = new DataGridTemplateColumn

            {

                Header = "Action",

                Width = actionWidth,

                MinWidth = actionMinWidth,

                IsReadOnly = true,

                HeaderStyle = (Style)ResolveResource("SoListColumnHeader")

            };

            actions.CellTemplate = CreateActionTemplate(vm);

            ListGrid.Columns.Add(actions);

        }



        var visible = new HashSet<string>(vm.VisibleColumnKeys, StringComparer.OrdinalIgnoreCase);

        foreach (var col in vm.AllColumns)

        {

            if (!visible.Contains(col.Key))

                continue;



            var gridCol = new DataGridTextColumn

            {

                Header = CreateSortHeader(col),

                Width = double.IsNaN(col.Width) ? new DataGridLength(1, DataGridLengthUnitType.Star) : col.Width,

                IsReadOnly = true,

                HeaderStyle = (Style)ResolveResource("SoListSortableColumnHeader"),

                ElementStyle = CreateCellStyle(col.IsAmount, col.HorizontalAlignment)

            };

            gridCol.Binding = new Binding

            {

                Path = new PropertyPath("."),

                Converter = (CellValueConverter)ResolveResource("CellValueConverter"),

                ConverterParameter = col.Key

            };

            ListGrid.Columns.Add(gridCol);

        }



        ListGrid.FrozenColumnCount = ListGrid.Columns.Count >= 2 ? 2 : 0;

    }



    private DataTemplate CreateActionTemplate(IStandardListViewModel vm)

    {

        var template = new DataTemplate();

        var stackFactory = new FrameworkElementFactory(typeof(StackPanel));

        stackFactory.SetValue(StackPanel.OrientationProperty, Orientation.Horizontal);

        stackFactory.SetValue(StackPanel.HorizontalAlignmentProperty, HorizontalAlignment.Center);

        stackFactory.SetValue(StackPanel.MarginProperty, new Thickness(4, 6, 4, 6));



        if (vm.ShowPrintAction && vm.PrintRowCommand is not null)

            stackFactory.AppendChild(CreateActionButtonFactory("Print", "\uE749", vm.PrintRowCommand, "SoListActionPrintButton"));

        if (vm.ShowBarcodeLabelAction && vm.BarcodeLabelRowCommand is not null)

            stackFactory.AppendChild(CreateActionButtonFactory("Barcode Label Print", "\uE963", vm.BarcodeLabelRowCommand, "SoListActionBarcodeButton"));

        if (vm.ShowBomAction && vm.BomRowCommand is not null)

            stackFactory.AppendChild(CreateActionButtonFactory("BOM - Bill of Material", "\uE8F1", vm.BomRowCommand, "SoListActionBomButton"));

        if (vm.ShowEditAction && vm.EditRowCommand is not null)

            stackFactory.AppendChild(CreateActionButtonFactory("Edit", "\uE70F", vm.EditRowCommand, "SoListActionEditButton"));

        if (vm.ShowDesignLayoutAction && vm is MockPageViewModel { DesignRowCommand: { } designCmd })

            stackFactory.AppendChild(CreateActionButtonFactory("Canvas design", "\uE8A5", designCmd, "SoListActionEditButton"));

        if (vm.ShowDeleteAction && vm.DeleteRowCommand is not null)

            stackFactory.AppendChild(CreateActionButtonFactory("Delete Selected", "\uE74D", vm.DeleteRowCommand, "SoListActionDeleteButton"));



        template.VisualTree = stackFactory;

        return template;

    }



    private static FrameworkElementFactory CreateActionButtonFactory(

        string toolTip,

        string glyph,

        ICommand command,

        string styleKey)

    {

        var btn = new FrameworkElementFactory(typeof(Button));

        btn.SetValue(Button.ToolTipProperty, toolTip);

        btn.SetValue(Button.CommandProperty, command);

        btn.SetValue(Button.CommandParameterProperty, new Binding("Tag"));

        btn.SetResourceReference(Button.StyleProperty, styleKey);

        var icon = new FrameworkElementFactory(typeof(TextBlock));

        icon.SetValue(TextBlock.TextProperty, glyph);

        icon.SetValue(TextBlock.FontSizeProperty, 12.0);

        icon.SetResourceReference(TextBlock.StyleProperty, "IconText");

        btn.AppendChild(icon);

        return btn;

    }



    private object ResolveResource(string key) =>

        FindResource(key) ?? Application.Current.FindResource(key);



    private Style CreateCellStyle(bool isAmount = false, string alignment = "Left", bool center = false, bool noWrap = false)

    {

        var baseStyle = (Style)ResolveResource(isAmount ? "SoListAmountCell" : "SoListCell");

        var style = new Style(typeof(TextBlock), baseStyle);

        if (center)

            style.Setters.Add(new Setter(TextBlock.HorizontalAlignmentProperty, HorizontalAlignment.Center));

        else if (isAmount || alignment.Equals("Right", StringComparison.OrdinalIgnoreCase))

            style.Setters.Add(new Setter(TextBlock.HorizontalAlignmentProperty, HorizontalAlignment.Right));

        if (noWrap)

            style.Setters.Add(new Setter(TextBlock.TextWrappingProperty, TextWrapping.NoWrap));

        return style;

    }



    private object CreateSortHeader(ListColumnDef col, bool centerHeader = false)

    {

        if (!col.Sortable)

            return col.Header;



        var panel = new StackPanel { Orientation = Orientation.Horizontal };

        if (centerHeader)

            panel.HorizontalAlignment = HorizontalAlignment.Center;



        var btn = new Button

        {

            Style = (Style)ResolveResource("SoListSortHeader"),

            Command = Vm?.SortColumnCommand,

            CommandParameter = col.Key,

            Content = panel

        };

        panel.Children.Add(new TextBlock { Text = col.Header });

        var glyph = new TextBlock();

        glyph.SetBinding(TextBlock.TextProperty, new MultiBinding

        {

            Converter = (SortGlyphConverter)ResolveResource("SortGlyphConverter"),

            ConverterParameter = col.Key,

            Bindings =

            {

                new Binding(nameof(IStandardListViewModel.CurrentSortField)) { Source = Vm },

                new Binding(nameof(IStandardListViewModel.CurrentSortDir)) { Source = Vm }

            }

        });

        panel.Children.Add(glyph);

        return btn;

    }



    private void OnGridHeaderClick(object sender, MouseButtonEventArgs e)

    {

        if (FindParent<Button>(e.OriginalSource as DependencyObject) is not null)

            return;

        if (FindParent<DataGridColumnHeader>(e.OriginalSource as DependencyObject) is not { Column: { } column })

            return;

        if (column.Header is Button { CommandParameter: string key })

            Vm?.ApplySort(key);

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



    private void SyncGridHeight()

    {

        if (ListGrid.Parent is not Grid host)

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

            ListGrid.MaxHeight = available;

        else

            ListGrid.ClearValue(DataGrid.MaxHeightProperty);

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

        if (Vm?.ExportDataCommand?.CanExecute("excel") == true)

            Vm.ExportDataCommand.Execute("excel");

    }



    private void OnExportPdfClick(object sender, MouseButtonEventArgs e)

    {

        e.Handled = true;

        CloseExportMenu();

        if (Vm?.ExportDataCommand?.CanExecute("pdf") == true)

            Vm.ExportDataCommand.Execute("pdf");

    }



    private void OnExportPrintClick(object sender, MouseButtonEventArgs e)

    {

        e.Handled = true;

        CloseExportMenu();

        if (Vm?.ExportDataCommand?.CanExecute("print") == true)

            Vm.ExportDataCommand.Execute("print");

    }

}

