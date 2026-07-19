using System.Globalization;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Markup;
using System.Windows.Media;
using IMS.Helpers;
using IMS.Reporting.Barcode;
using IMS.Reporting.Services;
using IMS.Reporting.Core.Fields;
using IMS.Reporting.Data;
using IMS.Reporting.Models;
using IMS.Services;

namespace IMS.Reporting.Engine;

public static class ReportLayoutRenderer
{
    private static readonly CultureInfo In = CultureInfo.GetCultureInfo("en-IN");

    public static FixedDocument BuildFixedDocument(
        ReportLayoutDocument layout,
        ReportDocumentContext ctx,
        IReadOnlyList<ReportFieldRegistryEntryDto>? registry)
    {
        var pageSize = ReportLayoutUnits.PageSizeDips(layout.Page);
        var margins = ReportLayoutUnits.MarginsDips(layout.Page.MarginsMm);
        var theme = layout.Theme;
        var textBrush = ReportLayoutUnits.ParseBrush(theme.TextColor, Brushes.Black);
        var borderBrush = ReportLayoutUnits.ParseBrush(theme.BorderColor, Brushes.Black);
        var primaryBrush = ReportLayoutUnits.ParseBrush(theme.PrimaryColor, Brushes.Black);

        var doc = new FixedDocument();
        var page = new FixedPage
        {
            Width = pageSize.Width,
            Height = pageSize.Height,
            Background = Brushes.White
        };

        var contentWidth = pageSize.Width - margins.Left - margins.Right;
        var originX = margins.Left;
        var originY = margins.Top;

        foreach (var element in layout.Elements
                     .Where(e => e.Visible)
                     .OrderBy(e => e.ZIndex)
                     .ThenBy(e => e.YMm))
        {
            var child = RenderElement(element, layout, ctx, registry, textBrush, borderBrush, primaryBrush, contentWidth);
            if (child is null)
                continue;

            var left = originX + ReportLayoutUnits.MmToDips(element.XMm);
            var top = originY + ReportLayoutUnits.MmToDips(element.YMm);
            var width = ReportLayoutUnits.MmToDips(element.WidthMm);
            var height = ReportLayoutUnits.MmToDips(element.HeightMm);

            FixedPage.SetLeft(child, left);
            FixedPage.SetTop(child, top);
            if (child is FrameworkElement fe)
            {
                fe.Width = width;
                fe.Height = height;
            }
            page.Children.Add(child);
        }

        var pageContent = new PageContent();
        ((IAddChild)pageContent).AddChild(page);
        doc.Pages.Add(pageContent);
        return doc;
    }

    private static UIElement? RenderElement(
        ReportElementDefinition element,
        ReportLayoutDocument layout,
        ReportDocumentContext ctx,
        IReadOnlyList<ReportFieldRegistryEntryDto>? registry,
        Brush textBrush,
        Brush borderBrush,
        Brush primaryBrush,
        double contentWidthDip)
    {
        var type = element.Type.Trim().ToLowerInvariant();
        return type switch
        {
            "line" => RenderLine(element, borderBrush),
            "rectangle" => RenderRectangle(element, layout, borderBrush),
            "table" => RenderTable(element, layout, ctx, textBrush, borderBrush, primaryBrush, contentWidthDip),
            "barcode" => RenderBarcodeElement(element, ctx, registry),
            "qrcode" => RenderQrElement(element, ctx, registry),
            "companyLogo" => RenderLogo(element, ctx, textBrush),
            _ => RenderTextElement(element, layout, ctx, registry, textBrush, borderBrush)
        };
    }

    private static UIElement RenderTextElement(
        ReportElementDefinition element,
        ReportLayoutDocument layout,
        ReportDocumentContext ctx,
        IReadOnlyList<ReportFieldRegistryEntryDto>? registry,
        Brush textBrush,
        Brush borderBrush)
    {
        var style = element.Style;
        var fg = ReportLayoutUnits.ParseBrush(style.Foreground ?? layout.Theme.TextColor, textBrush);
        var text = ReportFieldResolver.ResolveElementText(element, ctx, registry);

        var block = new TextBlock
        {
            Text = text,
            FontFamily = new FontFamily(style.FontFamily ?? layout.Theme.FontFamily),
            FontSize = style.FontSizePt ?? layout.Theme.BaseFontSizePt,
            FontWeight = ReportLayoutUnits.ParseFontWeight(style.FontWeight),
            FontStyle = string.Equals(element.Name, "Amount in words", StringComparison.OrdinalIgnoreCase)
                ? FontStyles.Italic
                : FontStyles.Normal,
            TextAlignment = ReportLayoutUnits.ParseAlignment(style.TextAlign),
            TextWrapping = TextWrapping.Wrap,
            Foreground = fg,
            ClipToBounds = true
        };

        var bg = ReportLayoutUnits.ParseBrush(style.Background, Brushes.Transparent);

        if (style.BorderThicknessMm <= 0)
        {
            return new Border
            {
                Child = block,
                Background = bg,
                ClipToBounds = true
            };
        }

        return new Border
        {
            Child = block,
            Background = bg,
            BorderBrush = ReportLayoutUnits.ParseBrush(style.BorderColor ?? layout.Theme.BorderColor, borderBrush),
            BorderThickness = new Thickness(ReportLayoutUnits.MmToDips(style.BorderThicknessMm)),
            Padding = new Thickness(2)
        };
    }

    private static UIElement RenderLogo(
        ReportElementDefinition element,
        ReportDocumentContext ctx,
        Brush textBrush)
    {
        var bg = ReportLayoutUnits.ParseBrush(
            element.Style.Background ?? ReportTaxInvoiceLayout.LogoBlue,
            new SolidColorBrush(Color.FromRgb(30, 58, 138)));
        var fg = ReportLayoutUnits.ParseBrush(element.Style.Foreground ?? "#ffffff", Brushes.White);
        var width = ReportLayoutUnits.MmToDips(element.WidthMm);
        var height = ReportLayoutUnits.MmToDips(element.HeightMm);

        var logoChild = CompanyLogoHelper.CreateLogoElement(ctx.Company.LogoImage, ctx.Company.LogoText, width, height)
            ?? new TextBlock { Text = ctx.Company.LogoText, Foreground = fg };

        if (logoChild is TextBlock textBlock)
        {
            textBlock.Foreground = fg;
            textBlock.FontWeight = FontWeights.Bold;
            textBlock.FontSize = element.Style.FontSizePt ?? 18;
            textBlock.FontStyle = FontStyles.Italic;
        }

        return new Border
        {
            Background = bg,
            CornerRadius = new CornerRadius(ReportLayoutUnits.MmToDips(element.WidthMm / 2)),
            Width = width,
            Height = height,
            Child = logoChild
        };
    }

    private static UIElement? RenderBarcodeElement(
        ReportElementDefinition element,
        ReportDocumentContext ctx,
        IReadOnlyList<ReportFieldRegistryEntryDto>? registry)
    {
        var payload = ReportFieldResolver.ResolveElementText(element, ctx, registry);
        if (string.IsNullOrWhiteSpace(payload))
            payload = ctx.Document.FormattedDocNo;
        var w = ReportLayoutUnits.MmToDips(element.WidthMm);
        var h = ReportLayoutUnits.MmToDips(element.HeightMm);
        return BarcodeRenderHelper.RenderBarcode(payload, element.Barcode ?? new ReportBarcodeSettings(), w, h)
               ?? new TextBlock { Text = payload, FontSize = 8 };
    }

    private static UIElement? RenderQrElement(
        ReportElementDefinition element,
        ReportDocumentContext ctx,
        IReadOnlyList<ReportFieldRegistryEntryDto>? registry)
    {
        var payload = ReportFieldResolver.ResolveElementText(element, ctx, registry);
        if (string.IsNullOrWhiteSpace(payload))
            payload = ctx.Document.FormattedDocNo;
        var w = ReportLayoutUnits.MmToDips(element.WidthMm);
        var h = ReportLayoutUnits.MmToDips(element.HeightMm);
        return BarcodeRenderHelper.RenderQrCode(payload, w, h)
               ?? new TextBlock { Text = "QR", FontSize = 8 };
    }

    private static UIElement RenderLine(ReportElementDefinition element, Brush borderBrush)
    {
        var vertical = element.HeightMm > element.WidthMm;
        var line = new System.Windows.Shapes.Line
        {
            X1 = 0,
            Y1 = 0,
            X2 = vertical ? 0 : ReportLayoutUnits.MmToDips(element.WidthMm),
            Y2 = vertical ? ReportLayoutUnits.MmToDips(element.HeightMm) : 0,
            Stroke = borderBrush,
            StrokeThickness = Math.Max(0.5, ReportLayoutUnits.MmToDips(0.3))
        };
        return line;
    }

    private static UIElement RenderRectangle(
        ReportElementDefinition element,
        ReportLayoutDocument layout,
        Brush borderBrush)
    {
        var rectBorder = ReportLayoutUnits.ParseBrush(element.Style.BorderColor ?? layout.Theme.BorderColor, borderBrush);
        return new Border
        {
            BorderBrush = rectBorder,
            BorderThickness = new Thickness(ReportLayoutUnits.MmToDips(element.Style.BorderThicknessMm > 0 ? element.Style.BorderThicknessMm : 0.3)),
            Background = ReportLayoutUnits.ParseBrush(element.Style.Background, Brushes.Transparent)
        };
    }

    private static UIElement RenderTable(
        ReportElementDefinition element,
        ReportLayoutDocument layout,
        ReportDocumentContext ctx,
        Brush textBrush,
        Brush borderBrush,
        Brush primaryBrush,
        double contentWidthDip)
    {
        var tableSettings = element.Table ?? new ReportTableSettings();
        var columns = tableSettings.Columns.Where(c => c.Visible).ToList();
        if (columns.Count == 0)
            columns = DefaultTableColumns();
        var headerBg = ReportLayoutUnits.ParseBrush(
            tableSettings.HeaderBackground ?? layout.Theme.PrimaryColor,
            primaryBrush);
        var headerFg = ReportLayoutUnits.ParseBrush(tableSettings.HeaderForeground ?? "#FFFFFF", Brushes.White);
        var grid = new Grid();
        var totalMm = columns.Sum(c => c.WidthMm);
        if (totalMm <= 0)
            totalMm = 1;

        foreach (var col in columns)
        {
            grid.ColumnDefinitions.Add(new ColumnDefinition
            {
                Width = new GridLength(col.WidthMm / totalMm, GridUnitType.Star)
            });
        }

        var rowIndex = 0;
        if (tableSettings.ShowHeader && columns.Count > 0)
        {
            grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            for (var i = 0; i < columns.Count; i++)
            {
                grid.Children.Add(Cell(columns[i].Header, true, columns[i].Align, headerFg, borderBrush, rowIndex, i, headerBg));
            }
            rowIndex++;
        }

        var lines = ctx.Lines.OrderBy(l => l.Sr).ToList();
        decimal sumQty = 0;
        decimal sumAmount = 0;
        if (lines.Count == 0)
        {
            grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            var cell = Cell("No line items.", false, "left", textBrush, borderBrush, rowIndex, 0);
            Grid.SetColumnSpan(cell, Math.Max(columns.Count, 1));
            grid.Children.Add(cell);
        }
        else
        {
            foreach (var line in lines)
            {
                grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
                for (var i = 0; i < columns.Count; i++)
                {
                    var val = ReportFieldResolver.GetLineCellValue(columns[i].Key, line);
                    grid.Children.Add(Cell(val, false, columns[i].Align, textBrush, borderBrush, rowIndex, i));
                }
                sumQty += IndianAmountInWords.ParseDecimal(line.Qty);
                var lineAmount = IndianAmountInWords.ParseDecimal(line.Amount);
                if (lineAmount == 0)
                {
                    var qty = IndianAmountInWords.ParseDecimal(line.Qty);
                    var rate = IndianAmountInWords.ParseDecimal(line.Rate);
                    lineAmount = qty * rate;
                }
                sumAmount += lineAmount;
                rowIndex++;
            }

            if (tableSettings.ShowTotalsRow)
            {
                var footerBg = new SolidColorBrush(Color.FromRgb(245, 240, 235));
                grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
                for (var i = 0; i < columns.Count; i++)
                {
                    var key = columns[i].Key;
                    var val = key switch
                    {
                        "description" => "Total",
                        "qty" => sumQty.ToString("N2", In),
                        "amount" => $"₹ {sumAmount:N2}",
                        _ => string.Empty
                    };
                    grid.Children.Add(Cell(val, false, columns[i].Align, textBrush, borderBrush, rowIndex, i, footerBg, true));
                }
            }
        }

        var tableHeight = ReportLayoutUnits.MmToDips(element.HeightMm);
        var scroll = new ScrollViewer
        {
            Content = grid,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
            Height = tableHeight,
            MaxHeight = tableHeight,
            ClipToBounds = true
        };
        scroll.Width = Math.Min(contentWidthDip, ReportLayoutUnits.MmToDips(element.WidthMm));
        return scroll;
    }

    private static Border Cell(
        string text,
        bool header,
        string align,
        Brush textBrush,
        Brush borderBrush,
        int row,
        int col,
        Brush? background = null,
        bool bold = false)
    {
        var block = new TextBlock
        {
            Text = text,
            FontSize = header ? 9 : 8.5,
            FontWeight = header || bold ? FontWeights.SemiBold : FontWeights.Normal,
            TextAlignment = ReportLayoutUnits.ParseAlignment(align),
            Foreground = textBrush,
            Margin = new Thickness(3, 2, 3, 2),
            TextWrapping = TextWrapping.NoWrap
        };
        var border = new Border
        {
            Child = block,
            BorderBrush = borderBrush,
            BorderThickness = new Thickness(0.5),
            Background = background
        };
        Grid.SetRow(border, row);
        Grid.SetColumn(border, col);
        return border;
    }

    private static List<ReportTableColumnDefinition> DefaultTableColumns() =>
    [
        new() { Key = "srNo", Header = "Sr", WidthMm = 10, Align = "center", Visible = true },
        new() { Key = "itemCode", Header = "Code", WidthMm = 18, Visible = true },
        new() { Key = "description", Header = "Description", WidthMm = 48, Visible = true },
        new() { Key = "qty", Header = "Qty", WidthMm = 16, Align = "right", Visible = true },
        new() { Key = "rate", Header = "Rate", WidthMm = 20, Align = "right", Visible = true },
        new() { Key = "amount", Header = "Amount", WidthMm = 24, Align = "right", Visible = true }
    ];
}
