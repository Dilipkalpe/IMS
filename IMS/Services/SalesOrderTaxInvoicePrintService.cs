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

public static class SalesOrderTaxInvoicePrintService
{
    private static readonly Brush HeaderBrown = new SolidColorBrush(Color.FromRgb(92, 64, 51));
    private static readonly Brush BodyText = Brushes.Black;
    private static readonly Brush PageBackground = Brushes.White;
    private static readonly CultureInfo In = CultureInfo.GetCultureInfo("en-IN");

    public static void ShowPreview(SalesOrderDto order, SalesEntryType? entryType = null)
    {
        var layout = PrintSettingsService.Instance.GetPageLayout();
        var document = CreateConfiguredDocument(order, CompanyProfileService.Current);
        var invoiceNo = order.FormattedDocNo ?? $"SO-{order.DocNo}";
        var documentTitle = ResolveDocumentTitle(order, entryType);

        var window = new Window
        {
            Title = $"{documentTitle} — {invoiceNo} ({layout.FormatName})",
            WindowStartupLocation = WindowStartupLocation.CenterScreen,
            Owner = Application.Current?.MainWindow,
            Background = new SolidColorBrush(Color.FromRgb(226, 232, 240)),
            MinWidth = 420,
            MinHeight = 360
        };

        var root = new DockPanel { LastChildFill = true };

        var toolbar = new DockPanel { Margin = new Thickness(12, 10, 12, 8), LastChildFill = true };
        DockPanel.SetDock(toolbar, Dock.Top);

        var buttons = new StackPanel { Orientation = Orientation.Horizontal };
        var printBtn = new Button
        {
            Content = "Print…",
            Padding = new Thickness(18, 6, 18, 6),
            Margin = new Thickness(0, 0, 8, 0)
        };
        printBtn.Click += (_, _) => Print(order, showDialog: true, entryType);

        var closeBtn = new Button
        {
            Content = "Close",
            Padding = new Thickness(18, 6, 18, 6),
            IsCancel = true
        };
        closeBtn.Click += (_, _) => window.Close();

        buttons.Children.Add(printBtn);
        buttons.Children.Add(closeBtn);
        DockPanel.SetDock(buttons, Dock.Left);
        toolbar.Children.Add(buttons);

        var formatInfo = new TextBlock
        {
            Text = $"Paper: {layout.FormatName}  •  {layout.SizeLabel}  •  Margins {PrintSettingsService.Instance.Current.MarginMm:0.#} mm",
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Right,
            Foreground = BodyText,
            FontWeight = FontWeights.SemiBold,
            Margin = new Thickness(12, 0, 0, 0)
        };
        toolbar.Children.Add(formatInfo);

        var viewer = new FlowDocumentScrollViewer
        {
            Document = document,
            Width = layout.PageSizeDips.Width,
            Height = layout.PageSizeDips.Height,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
            Foreground = BodyText,
            Background = PageBackground
        };

        var pageSurface = new Border
        {
            Background = PageBackground,
            BorderBrush = Brushes.Gray,
            BorderThickness = new Thickness(1),
            Child = viewer,
            Width = layout.PageSizeDips.Width,
            Height = layout.PageSizeDips.Height,
            SnapsToDevicePixels = true
        };

        var viewbox = new Viewbox
        {
            Stretch = Stretch.Uniform,
            StretchDirection = StretchDirection.DownOnly,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(16, 0, 16, 16),
            MaxWidth = SystemParameters.WorkArea.Width * 0.92,
            MaxHeight = SystemParameters.WorkArea.Height * 0.78,
            Child = pageSurface
        };

        var scaledWidth = layout.PageSizeDips.Width * GetPreviewScale(layout.PageSizeDips) + 80;
        var scaledHeight = layout.PageSizeDips.Height * GetPreviewScale(layout.PageSizeDips) + 120;
        window.Width = Math.Clamp(scaledWidth, 420, SystemParameters.WorkArea.Width * 0.95);
        window.Height = Math.Clamp(scaledHeight, 360, SystemParameters.WorkArea.Height * 0.92);

        root.Children.Add(toolbar);
        root.Children.Add(viewbox);
        window.Content = root;
        window.ShowDialog();
    }

    private static double GetPreviewScale(Size pageSizeDips)
    {
        const double chromeWidth = 80;
        const double chromeHeight = 120;
        var maxW = SystemParameters.WorkArea.Width * 0.92 - chromeWidth;
        var maxH = SystemParameters.WorkArea.Height * 0.78 - chromeHeight;
        var scaleW = maxW / pageSizeDips.Width;
        var scaleH = maxH / pageSizeDips.Height;
        return Math.Min(1.0, Math.Min(scaleW, scaleH));
    }

    public static bool Print(SalesOrderDto order, bool showDialog = true, SalesEntryType? entryType = null)
    {
        var layout = PrintSettingsService.Instance.GetPageLayout();
        var document = CreateConfiguredDocument(order, CompanyProfileService.Current);
        var documentTitle = ResolveDocumentTitle(order, entryType);

        var printDialog = new PrintDialog();
        if (showDialog && printDialog.ShowDialog() != true)
            return false;

        ApplyPageSize(printDialog, layout.PageSizeDips);
        if (printDialog.PrintableAreaWidth > 0)
            document.ColumnWidth = Math.Min(layout.ContentWidthDips, printDialog.PrintableAreaWidth);

        var invoiceNo = order.FormattedDocNo ?? $"SO-{order.DocNo}";
        printDialog.PrintDocument(
            ((IDocumentPaginatorSource)document).DocumentPaginator,
            $"{documentTitle} {invoiceNo} ({layout.FormatName})");
        return true;
    }

    private static string ResolveDocumentTitle(SalesOrderDto order, SalesEntryType? entryType = null)
    {
        if (!string.IsNullOrWhiteSpace(order.DocumentTitle))
            return order.DocumentTitle.Trim();

        if (entryType is not null)
            return SalesEntryCatalog.GetPrintHeaderTitle(entryType.Value);

        return SalesEntryCatalog.GetPrintHeaderTitle(SalesEntryType.SalesOrder);
    }

    private static FlowDocument CreateConfiguredDocument(SalesOrderDto order, InvoiceCompanyProfile? company = null)
    {
        var document = BuildDocument(order, company ?? CompanyProfileService.Current);
        ConfigurePageLayout(document);
        return document;
    }

    private static void ConfigurePageLayout(FlowDocument document)
    {
        var layout = PrintSettingsService.Instance.GetPageLayout();
        document.PageWidth = layout.PageSizeDips.Width;
        document.PageHeight = layout.PageSizeDips.Height;
        document.PagePadding = layout.PagePaddingDips;
        document.ColumnWidth = layout.ContentWidthDips;
    }

    private static void ApplyPageSize(PrintDialog dialog, Size pageSizeDips)
    {
        try
        {
            var ticket = dialog.PrintTicket ?? dialog.PrintQueue.DefaultPrintTicket;
            if (ticket is null) return;
            ticket.PageMediaSize = new PageMediaSize(pageSizeDips.Width, pageSizeDips.Height);
            ticket.PageOrientation = PageOrientation.Portrait;
            dialog.PrintTicket = ticket;
        }
        catch
        {
            // Driver may reject custom size.
        }
    }

    private static FlowDocument BuildDocument(SalesOrderDto order, InvoiceCompanyProfile company)
    {
        var doc = new FlowDocument
        {
            FontFamily = new FontFamily("Segoe UI"),
            FontSize = 11,
            Foreground = BodyText,
            Background = PageBackground,
            PagePadding = new Thickness(0)
        };

        doc.Blocks.Add(BuildCompanyHeader(company));
        doc.Blocks.Add(new Paragraph(Text(ResolveDocumentTitle(order)))
        {
            FontSize = 16,
            FontWeight = FontWeights.Bold,
            TextAlignment = TextAlignment.Center,
            Margin = new Thickness(0, 4, 0, 8)
        });

        doc.Blocks.Add(BuildInfoSection(order, company));
        doc.Blocks.Add(BuildLineItemsTable(order));
        doc.Blocks.Add(BuildFooterSection(order, company));

        return doc;
    }

    private static Table BuildCompanyHeader(InvoiceCompanyProfile c)
    {
        var table = new Table { CellSpacing = 0 };
        table.Columns.Add(new TableColumn { Width = new GridLength(4, GridUnitType.Star) });
        table.Columns.Add(new TableColumn { Width = new GridLength(1, GridUnitType.Star) });

        var row = new TableRow();
        var left = new TableCell
        {
            BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(1, 1, 0, 1),
            Padding = new Thickness(8, 6, 8, 6)
        };
        left.Blocks.Add(new Paragraph(Text(c.BusinessName))
        {
            FontSize = 18,
            FontWeight = FontWeights.Bold,
            Margin = new Thickness(0)
        });
        left.Blocks.Add(new Paragraph(Text(c.Address)) { Margin = new Thickness(0, 2, 0, 0), FontSize = 10 });
        left.Blocks.Add(new Paragraph(Text($"Phone no.: {c.Phone}")) { Margin = new Thickness(0, 2, 0, 0), FontSize = 10 });
        left.Blocks.Add(new Paragraph(Text($"GSTIN: {c.Gstin}    State: {c.State}"))
        {
            Margin = new Thickness(0, 2, 0, 0),
            FontSize = 10
        });

        var right = new TableCell
        {
            BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(0, 1, 1, 1),
            Padding = new Thickness(8),
            Background = new SolidColorBrush(Color.FromRgb(30, 58, 95)),
            TextAlignment = TextAlignment.Center
        };
        var logoElement = CompanyLogoHelper.CreateLogoElement(c.LogoImage, c.LogoText, 120, 64)!;
        if (logoElement is TextBlock tb)
        {
            tb.Foreground = Brushes.White;
            tb.FontSize = 22;
            tb.FontWeight = FontWeights.Bold;
        }
        right.Blocks.Add(new BlockUIContainer(logoElement) { TextAlignment = TextAlignment.Center });

        row.Cells.Add(left);
        row.Cells.Add(right);
        var group = new TableRowGroup();
        group.Rows.Add(row);
        table.RowGroups.Add(group);
        return table;
    }

    private static Table BuildInfoSection(SalesOrderDto order, InvoiceCompanyProfile company)
    {
        var invoiceNo = order.FormattedDocNo ?? order.DocNo.ToString(In);
        var date = FormatInvoiceDate(order.BillDate, order.SoDate);
        var customer = order.Customer ?? "—";
        var contact = string.IsNullOrWhiteSpace(order.CustomerDetails) ? "—" : order.CustomerDetails;

        var table = new Table { CellSpacing = 0, Margin = new Thickness(0, 0, 0, 6) };
        for (var i = 0; i < 3; i++)
            table.Columns.Add(new TableColumn { Width = new GridLength(1, GridUnitType.Star) });

        var row = new TableRow();
        row.Cells.Add(InfoCell("Bill To",
            $"Customer Name: {customer}\nContact No.: {contact}"));
        row.Cells.Add(InfoCell("Transportation Details",
            $"Transport Name: {order.SalesMan ?? "—"}\nDelivery Location: {order.ShippingAddress ?? "—"}"));
        row.Cells.Add(InfoCell("Invoice Details",
            $"Invoice No.: {invoiceNo}\nDate: {date}\nPlace of supply: {company.PlaceOfSupply}"));

        var group = new TableRowGroup();
        group.Rows.Add(row);
        table.RowGroups.Add(group);
        return table;
    }

    private static TableCell InfoCell(string title, string body)
    {
        var cell = new TableCell
        {
            BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(1),
            Padding = new Thickness(6, 4, 6, 4)
        };
        cell.Blocks.Add(new Paragraph(Text(title, bold: true)) { Margin = new Thickness(0, 0, 0, 4) });
        foreach (var line in body.Split('\n'))
            cell.Blocks.Add(new Paragraph(Text(line)) { Margin = new Thickness(0, 0, 0, 2), FontSize = 10 });
        return cell;
    }

    private static Table BuildLineItemsTable(SalesOrderDto order)
    {
        var lines = order.Lines ?? [];
        var table = new Table { CellSpacing = 0 };

        foreach (var _ in new[] { 0.5, 2.8, 1.0, 0.8, 0.7, 0.9, 0.7, 1.1, 1.2 })
            table.Columns.Add(new TableColumn { Width = new GridLength(1, GridUnitType.Star) });

        var headers = new[] { "#", "Item name", "HSN/ SAC", "COLOUR", "Size", "Quantity", "Unit", "Price/ Unit", "Amount" };
        var headerGroup = new TableRowGroup();
        var headerRow = new TableRow { Background = HeaderBrown };
        foreach (var h in headers)
            headerRow.Cells.Add(HeaderCell(h));
        headerGroup.Rows.Add(headerRow);
        table.RowGroups.Add(headerGroup);

        var bodyGroup = new TableRowGroup();
        decimal totalQty = 0;
        decimal totalAmount = 0;

        if (lines.Count == 0)
        {
            var emptyRow = new TableRow();
            var emptyCell = new TableCell(new Paragraph(Text("No line items on this order.")))
            {
                ColumnSpan = headers.Length,
                BorderBrush = Brushes.Black,
                BorderThickness = new Thickness(0, 0, 1, 1),
                Padding = new Thickness(8, 6, 8, 6)
            };
            emptyRow.Cells.Add(emptyCell);
            bodyGroup.Rows.Add(emptyRow);
        }
        else
        {
            foreach (var line in lines.OrderBy(l => l.Sr))
            {
                var qty = IndianAmountInWords.ParseDecimal(line.Qty);
                var rate = IndianAmountInWords.ParseDecimal(line.Rate);
                var amount = IndianAmountInWords.ParseDecimal(line.Amount);
                if (amount == 0 && qty > 0)
                    amount = qty * rate;

                totalQty += qty;
                totalAmount += amount;

                var row = new TableRow();
                row.Cells.Add(BodyCell(line.Sr.ToString(In)));
                row.Cells.Add(BodyCell(line.ItemDescription ?? line.ProductRetailCode ?? "—"));
                row.Cells.Add(BodyCell(line.ProductRetailCode ?? "—"));
                row.Cells.Add(BodyCell("—"));
                row.Cells.Add(BodyCell("—"));
                row.Cells.Add(BodyCell(qty.ToString("N2", In), TextAlignment.Right));
                row.Cells.Add(BodyCell("PCS"));
                row.Cells.Add(BodyCell(FormatCurrency(rate), TextAlignment.Right));
                row.Cells.Add(BodyCell(FormatCurrency(amount), TextAlignment.Right));
                bodyGroup.Rows.Add(row);
            }

            var totalRow = new TableRow { Background = new SolidColorBrush(Color.FromRgb(245, 240, 235)) };
            totalRow.Cells.Add(BodyCell("Total", colspan: 5, bold: true));
            totalRow.Cells.Add(BodyCell(totalQty.ToString("N2", In), TextAlignment.Right, bold: true));
            totalRow.Cells.Add(BodyCell(""));
            totalRow.Cells.Add(BodyCell(""));
            totalRow.Cells.Add(BodyCell(FormatCurrency(totalAmount), TextAlignment.Right, bold: true));
            bodyGroup.Rows.Add(totalRow);
        }

        table.RowGroups.Add(bodyGroup);
        return table;
    }

    private static Table BuildFooterSection(SalesOrderDto order, InvoiceCompanyProfile company)
    {
        var gross = IndianAmountInWords.ParseDecimal(order.Totals?.Gross);
        var discount = IndianAmountInWords.ParseDecimal(order.Totals?.Discount);
        var net = IndianAmountInWords.ParseDecimal(order.Totals?.Net ?? order.Totals?.SaleAmount);
        if (net == 0)
            net = gross - discount;

        var discPercent = gross > 0 ? discount / gross * 100m : 0m;
        var received = net;
        var balance = IndianAmountInWords.ParseDecimal(order.Totals?.ReceivableToCustomer);

        var outer = new Table { CellSpacing = 0, Margin = new Thickness(0, 8, 0, 0) };
        outer.Columns.Add(new TableColumn { Width = new GridLength(1.15, GridUnitType.Star) });
        outer.Columns.Add(new TableColumn { Width = new GridLength(0.85, GridUnitType.Star) });

        var row = new TableRow();

        var left = new TableCell { Padding = new Thickness(0, 0, 16, 0), Background = PageBackground };
        left.Blocks.Add(new Paragraph(Text("Invoice Amount in Words", bold: true))
        {
            Margin = new Thickness(0, 0, 0, 2)
        });
        left.Blocks.Add(new Paragraph(Text(IndianAmountInWords.ToRupeeWords(net)))
        {
            FontStyle = FontStyles.Italic,
            Margin = new Thickness(0, 0, 0, 8)
        });
        left.Blocks.Add(new Paragraph(Text("Terms and Conditions", bold: true)));
        foreach (var term in company.Terms)
            left.Blocks.Add(new Paragraph(Text($"• {term}")) { FontSize = 10, Margin = new Thickness(0, 0, 0, 2) });
        left.Blocks.Add(new Paragraph(Text("Bank Details", bold: true)) { Margin = new Thickness(0, 8, 0, 4) });
        left.Blocks.Add(new Paragraph(Text($"Name: {company.BankName}")) { FontSize = 10 });
        left.Blocks.Add(new Paragraph(Text($"Account No.: {company.BankAccountNo}")) { FontSize = 10 });
        left.Blocks.Add(new Paragraph(Text($"IFSC code: {company.BankIfsc}")) { FontSize = 10 });
        left.Blocks.Add(new Paragraph(Text($"Account holder's name: {company.BankAccountHolder}")) { FontSize = 10 });

        var right = new TableCell
        {
            Padding = new Thickness(10, 8, 10, 8),
            BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(1),
            Background = PageBackground
        };
        right.Blocks.Add(BuildSummaryTable(
            gross, discount, discPercent, net, received, balance));

        row.Cells.Add(left);
        row.Cells.Add(right);
        var group = new TableRowGroup();
        group.Rows.Add(row);
        outer.RowGroups.Add(group);
        return outer;
    }

    private static Table BuildSummaryTable(
        decimal gross,
        decimal discount,
        decimal discPercent,
        decimal net,
        decimal received,
        decimal balance)
    {
        var table = new Table { CellSpacing = 0 };
        table.Columns.Add(new TableColumn { Width = new GridLength(1.25, GridUnitType.Star) });
        table.Columns.Add(new TableColumn { Width = new GridLength(1, GridUnitType.Star) });

        var rows = new List<(string Label, string Value, bool Bold)>
        {
            ("Sub Total", FormatCurrency(gross), false)
        };
        if (discount > 0)
            rows.Add(($"Discount ({discPercent:N2}%)", FormatCurrency(discount), false));
        rows.AddRange(
        [
            ("Total", FormatCurrency(net), true),
            ("Received", FormatCurrency(received), false),
            ("Balance", FormatCurrency(balance), false),
            ("Previous Balance", FormatCurrency(0), false),
            ("Current Balance", FormatCurrency(balance), false),
            ("Earned Points", "0", false),
            ("Available Points", "0", false)
        ]);

        var group = new TableRowGroup();
        foreach (var (label, value, bold) in rows)
        {
            var row = new TableRow();
            row.Cells.Add(SummaryCell(label, TextAlignment.Left, bold));
            row.Cells.Add(SummaryCell(value, TextAlignment.Right, bold));
            group.Rows.Add(row);
        }

        table.RowGroups.Add(group);
        return table;
    }

    private static TableCell SummaryCell(string text, TextAlignment align, bool bold)
    {
        return new TableCell(new Paragraph(Text(text, bold: bold))
        {
            TextAlignment = align,
            Margin = new Thickness(2, 3, 2, 3),
            FontSize = 11
        })
        {
            Padding = new Thickness(2, 1, 2, 1),
            Background = PageBackground
        };
    }

    private static Run Text(string value, Brush? foreground = null, bool bold = false) =>
        new(value)
        {
            Foreground = foreground ?? BodyText,
            FontWeight = bold ? FontWeights.SemiBold : FontWeights.Normal
        };

    private static string FormatInvoiceDate(string? billDate, DateTime? soDate)
    {
        if (!string.IsNullOrWhiteSpace(billDate))
        {
            if (DateTime.TryParseExact(billDate, "dd/MM/yyyy", In, DateTimeStyles.None, out var dt))
                return dt.ToString("dd-MM-yyyy", In);
            if (DateTime.TryParse(billDate, In, DateTimeStyles.None, out dt))
                return dt.ToString("dd-MM-yyyy", In);
        }

        return (soDate ?? DateTime.Today).ToString("dd-MM-yyyy", In);
    }

    private static string FormatCurrency(decimal value) => $"₹ {value:N2}";

    private static TableCell HeaderCell(string text) =>
        new(new Paragraph(new Run(text) { Foreground = Brushes.White })
        {
            FontWeight = FontWeights.SemiBold,
            Margin = new Thickness(4, 4, 4, 4),
            FontSize = 10
        })
        {
            BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(0, 1, 1, 1),
            Background = HeaderBrown,
            Padding = new Thickness(2)
        };

    private static TableCell BodyCell(string text, TextAlignment align = TextAlignment.Left, bool bold = false, int colspan = 1)
    {
        var cell = new TableCell(new Paragraph(Text(text, bold: bold))
        {
            TextAlignment = align,
            Margin = new Thickness(4, 3, 4, 3),
            FontSize = 10
        })
        {
            BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(0, 0, 1, 1),
            Padding = new Thickness(2)
        };
        if (colspan > 1)
            cell.ColumnSpan = colspan;
        return cell;
    }
}
