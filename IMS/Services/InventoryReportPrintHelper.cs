using System.Printing;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;

namespace IMS.Services;

internal static class InventoryReportPrintHelper
{
    private static readonly Brush HeaderBackground = new SolidColorBrush(Color.FromRgb(241, 243, 246));
    private static readonly Brush BodyText = Brushes.Black;
    private static readonly Brush MetaText = new SolidColorBrush(Color.FromRgb(85, 85, 85));

    public static void ShowPreview(string title, FlowDocument document)
    {
        var layout = PrintSettingsService.Instance.GetPageLayout();

        var window = new Window
        {
            Title = title,
            WindowStartupLocation = WindowStartupLocation.CenterScreen,
            Owner = Application.Current?.MainWindow,
            Background = new SolidColorBrush(Color.FromRgb(233, 237, 242)),
            MinWidth = 520,
            MinHeight = 400,
            Width = Math.Min(1200, SystemParameters.WorkArea.Width * 0.92),
            Height = Math.Min(820, SystemParameters.WorkArea.Height * 0.88)
        };

        var root = new DockPanel { LastChildFill = true };

        var toolbar = new DockPanel { Margin = new Thickness(12, 10, 12, 8) };
        DockPanel.SetDock(toolbar, Dock.Top);

        var buttons = new StackPanel { Orientation = Orientation.Horizontal };
        var printBtn = new Button
        {
            Content = "Print…",
            Padding = new Thickness(18, 6, 18, 6),
            Margin = new Thickness(0, 0, 8, 0)
        };
        printBtn.Click += (_, _) =>
        {
            var dlg = new PrintDialog();
            if (dlg.ShowDialog() != true) return;
            var printableWidth = dlg.PrintableAreaWidth > 0 ? dlg.PrintableAreaWidth : document.PageWidth;
            var printableHeight = dlg.PrintableAreaHeight > 0 ? dlg.PrintableAreaHeight : document.PageHeight;
            document.PageWidth = printableWidth;
            document.PageHeight = printableHeight;
            document.ColumnWidth = printableWidth;
            dlg.PrintDocument(((IDocumentPaginatorSource)document).DocumentPaginator, title);
        };

        var closeBtn = new Button { Content = "Close", Padding = new Thickness(18, 6, 18, 6), IsCancel = true };
        closeBtn.Click += (_, _) => window.Close();
        buttons.Children.Add(printBtn);
        buttons.Children.Add(closeBtn);
        DockPanel.SetDock(buttons, Dock.Left);
        toolbar.Children.Add(buttons);

        toolbar.Children.Add(new TextBlock
        {
            Text = $"Paper: {layout.FormatName}  •  {layout.SizeLabel}",
            HorizontalAlignment = HorizontalAlignment.Right,
            VerticalAlignment = VerticalAlignment.Center,
            Foreground = BodyText,
            FontWeight = FontWeights.SemiBold,
            Margin = new Thickness(16, 0, 0, 0)
        });

        var viewer = new FlowDocumentScrollViewer
        {
            Document = document,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Auto,
            Foreground = BodyText,
            Background = Brushes.White
        };

        var pageHost = new Border
        {
            Background = Brushes.White,
            BorderBrush = new SolidColorBrush(Color.FromRgb(154, 167, 176)),
            BorderThickness = new Thickness(1),
            Child = viewer,
            Margin = new Thickness(12, 0, 12, 12),
            SnapsToDevicePixels = true
        };

        root.Children.Add(toolbar);
        root.Children.Add(pageHost);
        window.Content = root;
        window.ShowDialog();
    }

    public static FlowDocument CreateDocument(string reportTitle, string subtitle, double contentWidthDips, double fontSize = 11)
    {
        var layout = PrintSettingsService.Instance.GetPageLayout();
        var pageWidth = Math.Max(layout.PageSizeDips.Width, contentWidthDips + layout.PagePaddingDips.Left + layout.PagePaddingDips.Right);

        var doc = new FlowDocument
        {
            FontFamily = new FontFamily("Segoe UI"),
            FontSize = fontSize,
            Foreground = BodyText,
            PagePadding = layout.PagePaddingDips,
            PageWidth = pageWidth,
            ColumnWidth = contentWidthDips
        };

        doc.Blocks.Add(new Paragraph(new Run(reportTitle))
        {
            FontSize = 18,
            FontWeight = FontWeights.SemiBold,
            TextAlignment = TextAlignment.Center,
            Foreground = BodyText,
            Margin = new Thickness(0, 0, 0, 6)
        });

        doc.Blocks.Add(new Paragraph(new Run(subtitle))
        {
            FontSize = 11,
            Foreground = MetaText,
            Margin = new Thickness(0, 0, 0, 10)
        });

        return doc;
    }

    public static Table CreateTable(IReadOnlyList<double> columnWeights, double totalWidthDips)
    {
        var table = new Table
        {
            CellSpacing = 0,
            BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(1)
        };

        var starSum = columnWeights.Sum();
        foreach (var weight in columnWeights)
        {
            var colWidth = totalWidthDips * (weight / starSum);
            table.Columns.Add(new TableColumn { Width = new GridLength(colWidth) });
        }

        return table;
    }

    public static TableRowGroup AddHeaderRow(Table table, IReadOnlyList<string> headers, IReadOnlyList<TextAlignment>? alignments = null)
    {
        var group = new TableRowGroup();
        var row = new TableRow { FontWeight = FontWeights.SemiBold, Background = HeaderBackground };
        for (var i = 0; i < headers.Count; i++)
        {
            var align = alignments is not null && i < alignments.Count
                ? alignments[i]
                : i == 0 ? TextAlignment.Center : TextAlignment.Left;
            AddCell(row, headers[i], align, semiBold: true);
        }
        group.Rows.Add(row);
        table.RowGroups.Add(group);
        return group;
    }

    public static TableRowGroup AddBodyGroup(Table table)
    {
        var body = new TableRowGroup();
        table.RowGroups.Add(body);
        return body;
    }

    public static void AddCell(
        TableRow row,
        string text,
        TextAlignment align = TextAlignment.Left,
        bool semiBold = false,
        bool bold = false)
    {
        var para = new Paragraph(new Run(text ?? string.Empty))
        {
            TextAlignment = align,
            Margin = new Thickness(5, 4, 5, 4),
            Foreground = BodyText
        };
        if (semiBold || bold)
            para.FontWeight = FontWeights.SemiBold;
        if (bold)
            para.FontWeight = FontWeights.Bold;

        row.Cells.Add(new TableCell(para)
        {
            BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(0.5)
        });
    }

    public static void AddFooterPrintedAt(FlowDocument doc)
    {
        doc.Blocks.Add(new Paragraph(new Run($"Printed: {DateTime.Now:dd/MM/yyyy HH:mm}"))
        {
            FontSize = 10,
            Foreground = MetaText,
            Margin = new Thickness(0, 10, 0, 0)
        });
    }

    public static double LandscapeContentWidthDips()
    {
        var layout = PrintSettingsService.Instance.GetPageLayout();
        return Math.Max(520, layout.PageSizeDips.Height - layout.PagePaddingDips.Left - layout.PagePaddingDips.Right);
    }

    public static double PortraitContentWidthDips() =>
        PrintSettingsService.Instance.GetPageLayout().ContentWidthDips;
}
