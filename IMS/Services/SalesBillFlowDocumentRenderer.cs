using System.Globalization;
using System.Printing;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;
using IMS.Helpers;
using IMS.Models;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

public static class SalesBillFlowDocumentRenderer
{
    private static readonly CultureInfo In = CultureInfo.GetCultureInfo("en-IN");

    public static void ShowPreview(
        SalesOrderDto order,
        SalesBillLayoutDefinition layout,
        SalesEntryType? entryType = null)
    {
        var company = CompanyProfileService.Current;
        var document = BuildDocument(order, layout, company, entryType);
        var ctx = BuildContext(order, entryType);
        var pageSize = SalesBillLayoutHelper.PageSizeDips(layout.Page);
        var title = $"{ctx.DocumentTitle} — {ctx.InvoiceNo}";

        var window = new Window
        {
            Title = $"{title} (Preview)",
            WindowStartupLocation = WindowStartupLocation.CenterScreen,
            Owner = Application.Current?.MainWindow,
            Background = new SolidColorBrush(Color.FromRgb(226, 232, 240)),
            MinWidth = 420,
            MinHeight = 360,
            Width = Math.Min(pageSize.Width + 80, SystemParameters.WorkArea.Width * 0.95),
            Height = Math.Min(pageSize.Height + 140, SystemParameters.WorkArea.Height * 0.92)
        };

        var root = new DockPanel { LastChildFill = true };
        var toolbar = new DockPanel { Margin = new Thickness(12, 10, 12, 8) };
        DockPanel.SetDock(toolbar, Dock.Top);

        var buttons = new StackPanel { Orientation = Orientation.Horizontal };
        var printBtn = new Button { Content = "Print", Padding = new Thickness(18, 6, 18, 6), Margin = new Thickness(0, 0, 8, 0) };
        printBtn.Click += (_, _) => Print(order, layout, showDialog: true, entryType);
        var pdfBtn = new Button { Content = "Export PDF…", Padding = new Thickness(18, 6, 18, 6), Margin = new Thickness(0, 0, 8, 0) };
        pdfBtn.Click += (_, _) => SalesBillPdfExporter.ExportWithSaveDialog(order, layout, entryType);
        var closeBtn = new Button { Content = "Close", Padding = new Thickness(18, 6, 18, 6), IsCancel = true };
        closeBtn.Click += (_, _) => window.Close();
        buttons.Children.Add(printBtn);
        buttons.Children.Add(pdfBtn);
        buttons.Children.Add(closeBtn);
        toolbar.Children.Add(buttons);

        var viewer = new FlowDocumentScrollViewer
        {
            Document = document,
            Width = pageSize.Width,
            Height = pageSize.Height,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto
        };

        var surface = new Border
        {
            Background = Brushes.White,
            BorderBrush = Brushes.Gray,
            BorderThickness = new Thickness(1),
            Child = viewer,
            Width = pageSize.Width,
            Height = pageSize.Height
        };

        var viewbox = new Viewbox
        {
            Stretch = Stretch.Uniform,
            StretchDirection = StretchDirection.DownOnly,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(16),
            MaxWidth = SystemParameters.WorkArea.Width * 0.9,
            MaxHeight = SystemParameters.WorkArea.Height * 0.75,
            Child = surface
        };

        root.Children.Add(toolbar);
        root.Children.Add(viewbox);
        window.Content = root;
        window.ShowDialog();
    }

    public static bool Print(
        SalesOrderDto order,
        SalesBillLayoutDefinition layout,
        bool showDialog = true,
        SalesEntryType? entryType = null)
    {
        var document = BuildDocument(order, layout, CompanyProfileService.Current, entryType);
        var pageSize = SalesBillLayoutHelper.PageSizeDips(layout.Page);
        var ctx = BuildContext(order, entryType);

        var printDialog = new PrintDialog();
        if (showDialog && printDialog.ShowDialog() != true)
            return false;

        try
        {
            var ticket = printDialog.PrintTicket ?? printDialog.PrintQueue?.DefaultPrintTicket;
            if (ticket is not null)
            {
                ticket.PageMediaSize = new PageMediaSize(pageSize.Width, pageSize.Height);
                ticket.PageOrientation = PageOrientation.Portrait;
                printDialog.PrintTicket = ticket;
            }
        }
        catch
        {
            /* driver may reject custom size */
        }

        printDialog.PrintDocument(
            ((IDocumentPaginatorSource)document).DocumentPaginator,
            $"{ctx.DocumentTitle} {ctx.InvoiceNo}");
        return true;
    }

    public static FlowDocument BuildDocument(
        SalesOrderDto order,
        SalesBillLayoutDefinition layout,
        InvoiceCompanyProfile company,
        SalesEntryType? entryType = null)
    {
        var theme = layout.Theme;
        var textBrush = SalesBillLayoutHelper.ParseBrush(theme.TextColor, Brushes.Black);
        var borderBrush = SalesBillLayoutHelper.ParseBrush(theme.BorderColor, Brushes.Black);
        var primaryBrush = SalesBillLayoutHelper.ParseBrush(theme.PrimaryColor, Brushes.Black);
        var ctx = BuildContext(order, entryType);

        var doc = new FlowDocument
        {
            FontFamily = new FontFamily(theme.FontFamily),
            FontSize = theme.BaseFontSizePt,
            Foreground = textBrush,
            Background = Brushes.White,
            PageWidth = SalesBillLayoutHelper.PageSizeDips(layout.Page).Width,
            PageHeight = SalesBillLayoutHelper.PageSizeDips(layout.Page).Height,
            PagePadding = SalesBillLayoutHelper.PagePaddingDips(layout.Page.MarginMm),
            ColumnWidth = double.PositiveInfinity
        };

        var sections = layout.Sections
            .Where(s => BillFormatLayoutMerger.ShouldRenderSection(s, layout))
            .OrderBy(s => s.Order)
            .ThenBy(s => s.Y)
            .ToList();

        foreach (var section in sections)
        {
            var block = RenderSection(section, layout, order, company, ctx, textBrush, borderBrush, primaryBrush);
            if (block is not null)
                doc.Blocks.Add(block);
        }

        if (layout.ItemTable.Visible && !sections.Any(s => s.Type == "itemTable"))
            doc.Blocks.Add(RenderItemTable(layout, order, textBrush, borderBrush, primaryBrush));

        return doc;
    }

    private static Block? RenderSection(
        SalesBillSectionDefinition section,
        SalesBillLayoutDefinition layout,
        SalesOrderDto order,
        InvoiceCompanyProfile company,
        SalesBillPrintContext ctx,
        Brush textBrush,
        Brush borderBrush,
        Brush primaryBrush)
    {
        return section.Type switch
        {
            "header" => RenderHeader(section, ctx, textBrush),
            "companyLogo" => RenderCompanyLogo(section, company, borderBrush, primaryBrush),
            "companyDetails" => RenderCompanyDetails(section, company, layout, borderBrush, textBrush),
            "customerDetails" => RenderCustomerDetails(section, order, ctx, borderBrush, textBrush, "Customer"),
            "supplierDetails" => RenderCustomerDetails(section, order, ctx, borderBrush, textBrush, "Supplier"),
            "itemTable" => RenderItemTable(layout, order, textBrush, borderBrush, primaryBrush),
            "taxDetails" => RenderTaxDetails(section, order, layout, borderBrush, textBrush),
            "termsAndConditions" => RenderTerms(section, company, ctx, textBrush),
            "footer" => RenderFooter(section, ctx, textBrush),
            "field" => RenderField(section, ctx, textBrush),
            _ => null
        };
    }

    private static Paragraph RenderField(SalesBillSectionDefinition s, SalesBillPrintContext ctx, Brush textBrush)
    {
        var text = SalesBillLayoutHelper.ReplaceTokens(s.Text ?? s.Label, ctx);
        if (string.IsNullOrWhiteSpace(text))
            text = s.Label;
        return new Paragraph(new Run(text))
        {
            FontSize = s.FontSizePt ?? 10,
            FontWeight = SalesBillLayoutHelper.ParseFontWeight(s.FontWeight),
            TextAlignment = SalesBillLayoutHelper.ParseAlignment(s.Align),
            Foreground = SalesBillLayoutHelper.ParseBrush(s.Color, textBrush),
            Margin = new Thickness(0, 2, 0, 4)
        };
    }

    private static Paragraph RenderHeader(SalesBillSectionDefinition s, SalesBillPrintContext ctx, Brush textBrush)
    {
        var text = SalesBillLayoutHelper.ReplaceTokens(s.Text ?? "{{documentTitle}}", ctx);
        return new Paragraph(new Run(text))
        {
            FontSize = s.FontSizePt ?? 16,
            FontWeight = SalesBillLayoutHelper.ParseFontWeight(s.FontWeight ?? "bold"),
            TextAlignment = SalesBillLayoutHelper.ParseAlignment(s.Align),
            Foreground = SalesBillLayoutHelper.ParseBrush(s.Color, textBrush),
            Margin = new Thickness(0, 4, 0, 8)
        };
    }

    private static Block RenderCompanyLogo(
        SalesBillSectionDefinition s,
        InvoiceCompanyProfile company,
        Brush borderBrush,
        Brush primaryBrush)
    {
        var table = new Table { CellSpacing = 0, Margin = new Thickness(0, 0, 0, 6) };
        table.Columns.Add(new TableColumn { Width = new GridLength(1, GridUnitType.Star) });
        var row = new TableRow();
        var cell = new TableCell
        {
            Padding = new Thickness(12),
            Background = primaryBrush,
            TextAlignment = TextAlignment.Center
        };
        if (s.ShowBorder)
        {
            cell.BorderBrush = borderBrush;
            cell.BorderThickness = new Thickness(1);
        }

        var logoElement = CompanyLogoHelper.CreateLogoElement(company.LogoImage, company.LogoText, 180, 72)!;
        if (logoElement is TextBlock tb)
        {
            tb.Foreground = Brushes.White;
            tb.FontSize = 22;
            tb.FontWeight = FontWeights.Bold;
        }
        cell.Blocks.Add(new BlockUIContainer(logoElement) { TextAlignment = TextAlignment.Center });
        row.Cells.Add(cell);
        table.RowGroups.Add(new TableRowGroup { Rows = { row } });
        return table;
    }

    private static Block RenderCompanyDetails(
        SalesBillSectionDefinition s,
        InvoiceCompanyProfile company,
        SalesBillLayoutDefinition layout,
        Brush borderBrush,
        Brush textBrush)
    {
        var p = new Paragraph { Margin = new Thickness(0, 0, 0, 6), FontSize = s.FontSizePt ?? 10 };
        if (s.ShowBorder)
        {
            var bordered = new Paragraph();
            bordered.BorderBrush = borderBrush;
            bordered.BorderThickness = new Thickness(1);
            bordered.Padding = new Thickness(8);
            p = bordered;
        }
        p.Inlines.Add(new Run(company.BusinessName) { FontSize = 16, FontWeight = FontWeights.Bold });
        if (s.ShowAddress != false)
            p.Inlines.Add(new LineBreak());
        if (s.ShowAddress != false)
            p.Inlines.Add(new Run(company.Address));
        if (s.ShowPhone != false)
        {
            p.Inlines.Add(new LineBreak());
            p.Inlines.Add(new Run($"Phone: {company.Phone}"));
        }
        if (s.ShowGstin != false && layout.Visibility.ShowGst)
        {
            p.Inlines.Add(new LineBreak());
            p.Inlines.Add(new Run($"GSTIN: {company.Gstin}  State: {company.State}"));
        }
        p.Foreground = textBrush;
        return p;
    }

    private static Block RenderCustomerDetails(
        SalesBillSectionDefinition s,
        SalesOrderDto order,
        SalesBillPrintContext ctx,
        Brush borderBrush,
        Brush textBrush,
        string partyLabel = "Customer")
    {
        var customer = order.Customer ?? "—";
        var contact = string.IsNullOrWhiteSpace(order.CustomerDetails) ? "—" : order.CustomerDetails;
        var body =
            $"{partyLabel}: {customer}\nContact: {contact}\nInvoice No.: {ctx.InvoiceNo}\nDate: {ctx.Date}\nPlace of supply: {CompanyProfileService.Current.PlaceOfSupply}";

        var para = new Paragraph();
        foreach (var line in body.Split('\n'))
            para.Inlines.Add(new Run(line + "\n"));
        para.FontSize = s.FontSizePt ?? 10;
        para.Foreground = textBrush;
        para.Margin = new Thickness(0, 0, 0, 6);
        if (s.ShowBorder)
        {
            para.BorderBrush = borderBrush;
            para.BorderThickness = new Thickness(1);
            para.Padding = new Thickness(8);
        }
        return para;
    }

    private static Table RenderItemTable(
        SalesBillLayoutDefinition layout,
        SalesOrderDto order,
        Brush textBrush,
        Brush borderBrush,
        Brush primaryBrush)
    {
        var itemTable = layout.ItemTable;
        var columns = itemTable.Columns.Where(c => c.Visible).ToList();
        var headerBg = SalesBillLayoutHelper.ParseBrush(
            layout.Sections.FirstOrDefault(x => x.Type == "itemTable")?.HeaderBackground ?? layout.Theme.PrimaryColor,
            primaryBrush);
        var headerFg = SalesBillLayoutHelper.ParseBrush(
            layout.Sections.FirstOrDefault(x => x.Type == "itemTable")?.HeaderTextColor ?? "#FFFFFF",
            Brushes.White);

        var table = new Table { CellSpacing = 0, Margin = new Thickness(0, 0, 0, 8) };
        var totalWidth = columns.Sum(c => c.Width);
        foreach (var col in columns)
            table.Columns.Add(new TableColumn
            {
                Width = new GridLength(col.Width / Math.Max(totalWidth, 1), GridUnitType.Star)
            });

        if (itemTable.ShowHeader && columns.Count > 0)
        {
            var headerRow = new TableRow { Background = headerBg };
            foreach (var col in columns)
            {
                var cell = new TableCell(new Paragraph(new Run(col.Header) { Foreground = headerFg, FontWeight = FontWeights.SemiBold }))
                {
                    BorderBrush = borderBrush,
                    BorderThickness = new Thickness(1),
                    Padding = new Thickness(4, 3, 4, 3),
                    TextAlignment = SalesBillLayoutHelper.ParseAlignment(col.Align)
                };
                headerRow.Cells.Add(cell);
            }
            table.RowGroups.Add(new TableRowGroup { Rows = { headerRow } });
        }

        var bodyGroup = new TableRowGroup();
        var lines = order.Lines ?? [];
        decimal totalAmount = 0;

        if (lines.Count == 0)
        {
            var empty = new TableRow();
            var cell = new TableCell(new Paragraph(new Run("No line items.")))
            {
                ColumnSpan = Math.Max(columns.Count, 1),
                BorderBrush = borderBrush,
                BorderThickness = new Thickness(1),
                Padding = new Thickness(8)
            };
            empty.Cells.Add(cell);
            bodyGroup.Rows.Add(empty);
        }
        else
        {
            foreach (var line in lines.OrderBy(l => l.Sr))
            {
                var row = new TableRow();
                foreach (var col in columns)
                {
                    row.Cells.Add(new TableCell(new Paragraph(new Run(GetLineCellValue(col.Key, line))))
                    {
                        BorderBrush = borderBrush,
                        BorderThickness = new Thickness(1),
                        Padding = new Thickness(4, 2, 4, 2),
                        TextAlignment = SalesBillLayoutHelper.ParseAlignment(col.Align)
                    });
                }
                bodyGroup.Rows.Add(row);
                totalAmount += IndianAmountInWords.ParseDecimal(line.Amount);
            }

            var totalRow = new TableRow { Background = new SolidColorBrush(Color.FromRgb(245, 240, 235)) };
            foreach (var col in columns)
            {
                var val = col.Key == "amount" ? FormatCurrency(totalAmount)
                    : col.Key == "description" ? "Total"
                    : "";
                totalRow.Cells.Add(new TableCell(new Paragraph(new Run(val) { FontWeight = FontWeights.Bold }))
                {
                    BorderBrush = borderBrush,
                    BorderThickness = new Thickness(1),
                    Padding = new Thickness(4, 2, 4, 2),
                    TextAlignment = SalesBillLayoutHelper.ParseAlignment(col.Align)
                });
            }
            bodyGroup.Rows.Add(totalRow);
        }

        table.RowGroups.Add(bodyGroup);
        return table;
    }

    private static string GetLineCellValue(string key, SalesOrderLineDto line)
    {
        var qty = IndianAmountInWords.ParseDecimal(line.Qty);
        var rate = IndianAmountInWords.ParseDecimal(line.Rate);
        var amount = IndianAmountInWords.ParseDecimal(line.Amount);
        if (amount == 0 && qty > 0)
            amount = qty * rate;

        return key switch
        {
            "srNo" => line.Sr.ToString(In),
            "itemCode" => line.ProductRetailCode ?? "—",
            "hsnCode" => line.ProductRetailCode ?? "—",
            "description" => line.ItemDescription ?? line.ProductRetailCode ?? "—",
            "qty" => qty.ToString("N2", In),
            "rate" => FormatCurrency(rate),
            "discount" => line.DiscPercent ?? "0",
            "gstPercent" => line.TaxPercent ?? "0",
            "taxAmount" => line.DiscValue ?? "0",
            "amount" => FormatCurrency(amount),
            "orderedQty" => qty.ToString("N2", In),
            "receivedQty" => qty.ToString("N2", In),
            "acceptedQty" => qty.ToString("N2", In),
            "rejectedQty" => "0.00",
            "pendingQty" => "0.00",
            "unit" => line.TaxType ?? "—",
            _ => "—"
        };
    }

    private static Block RenderTaxDetails(
        SalesBillSectionDefinition s,
        SalesOrderDto order,
        SalesBillLayoutDefinition layout,
        Brush borderBrush,
        Brush textBrush)
    {
        var gross = IndianAmountInWords.ParseDecimal(order.Totals?.Gross);
        var discount = IndianAmountInWords.ParseDecimal(order.Totals?.Discount);
        var net = IndianAmountInWords.ParseDecimal(order.Totals?.Net ?? order.Totals?.SaleAmount);
        if (net == 0)
            net = gross - discount;

        var half = net / 2m;
        var table = new Table { CellSpacing = 0, Margin = new Thickness(0, 4, 0, 8) };
        table.Columns.Add(new TableColumn { Width = new GridLength(1.2, GridUnitType.Star) });
        table.Columns.Add(new TableColumn { Width = new GridLength(1, GridUnitType.Star) });

        var rows = new List<(string L, string V)>
        {
            ("Sub Total", FormatCurrency(gross)),
            ("Discount", FormatCurrency(discount)),
            ("Net Amount", FormatCurrency(net))
        };
        if (s.ShowCgst != false)
            rows.Add(("CGST (est.)", FormatCurrency(half * 0.09m)));
        if (s.ShowSgst != false)
            rows.Add(("SGST (est.)", FormatCurrency(half * 0.09m)));
        if (s.ShowIgst == true)
            rows.Add(("IGST (est.)", FormatCurrency(net * 0.18m)));
        if (s.ShowRoundOff != false)
            rows.Add(("Round Off", FormatCurrency(0)));
        if (layout.Visibility.ShowAmountInWords)
            rows.Add(("Amount in words", IndianAmountInWords.ToRupeeWords(net)));

        var group = new TableRowGroup();
        foreach (var (label, value) in rows)
        {
            var row = new TableRow();
            row.Cells.Add(Cell(label, borderBrush, s.ShowBorder));
            row.Cells.Add(Cell(value, borderBrush, s.ShowBorder, TextAlignment.Right));
            group.Rows.Add(row);
        }
        table.RowGroups.Add(group);
        return table;
    }

    private static TableCell Cell(string text, Brush border, bool showBorder, TextAlignment align = TextAlignment.Left) =>
        new(new Paragraph(new Run(text)))
        {
            BorderBrush = showBorder ? border : null,
            BorderThickness = showBorder ? new Thickness(1) : new Thickness(0),
            Padding = new Thickness(6, 3, 6, 3),
            TextAlignment = align
        };

    private static Paragraph RenderTerms(
        SalesBillSectionDefinition s,
        InvoiceCompanyProfile company,
        SalesBillPrintContext ctx,
        Brush textBrush)
    {
        var para = new Paragraph { FontSize = s.FontSizePt ?? 9, Foreground = textBrush, Margin = new Thickness(0, 4, 0, 4) };
        var custom = SalesBillLayoutHelper.ReplaceTokens(s.Text, ctx);
        if (!string.IsNullOrWhiteSpace(custom))
            para.Inlines.Add(new Run(custom));
        else
            foreach (var term in company.Terms)
                para.Inlines.Add(new Run($"• {term}\n"));
        return para;
    }

    private static Paragraph RenderFooter(SalesBillSectionDefinition s, SalesBillPrintContext ctx, Brush textBrush)
    {
        var text = SalesBillLayoutHelper.ReplaceTokens(s.Text ?? "Thank you for your business.", ctx);
        return new Paragraph(new Run(text))
        {
            FontSize = s.FontSizePt ?? 9,
            TextAlignment = SalesBillLayoutHelper.ParseAlignment(s.Align),
            Foreground = textBrush,
            Margin = new Thickness(0, 8, 0, 0)
        };
    }

    private static SalesBillPrintContext BuildContext(SalesOrderDto order, SalesEntryType? entryType)
    {
        var title = !string.IsNullOrWhiteSpace(order.DocumentTitle)
            ? order.DocumentTitle.Trim()
            : entryType is not null
                ? SalesEntryCatalog.GetPrintHeaderTitle(entryType.Value)
                : SalesEntryCatalog.GetPrintHeaderTitle(SalesEntryType.SalesOrder);

        var invoiceNo = order.FormattedDocNo ?? $"SO-{order.DocNo}";
        var date = FormatDate(order.BillDate, order.SoDate);
        return new SalesBillPrintContext
        {
            DocumentTitle = title,
            InvoiceNo = invoiceNo,
            Customer = order.Customer ?? "—",
            Date = date
        };
    }

    private static string FormatDate(string? billDate, DateTime? soDate)
    {
        if (!string.IsNullOrWhiteSpace(billDate))
            return billDate.Trim();
        return soDate?.ToString("dd-MMM-yyyy", In) ?? "—";
    }

    private static string FormatCurrency(decimal value) =>
        value.ToString("N2", In);
}
