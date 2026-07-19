using System.Printing;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;
using IMS.Models;
using IMS.Reporting.Print;
using IMS.Reporting.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels;
using IMS.ViewModels.SubPages;

namespace IMS.Services;

public static class PurchaseOrderPrintService
{
    public static async Task<bool> PrintAsync(PurchaseEntryFormViewModelBase order, bool showDialog = true)
    {
        await CompanyProfileService.RefreshAsync().ConfigureAwait(true);
        var dto = ApiDocumentMapper.ToSalesOrderDtoForPurchasePrint(order);
        var docKey = BillFormatTemplateService.DocTypeKeyFromPurchaseDoc(
            ApiDocumentMapper.ToApiType(order.EntryType));

        var v2 = await ReportPrintResolver.ResolveForPrintAsync(docKey, dto, "supplier").ConfigureAwait(true);
        if (v2 is not null)
        {
            await ReportGridColumnSync.ApplyOrganizationColumnVisibilityAsync(v2.Layout, docKey)
                .ConfigureAwait(true);
            return await UiThread.RunAsync(() =>
                ReportPrintEngine.Print(dto, v2, showDialog, entryType: null, partyLabel: "Supplier"));
        }

        var layout = await ResolveBillFormatLayoutAsync(order.EntryType, dto).ConfigureAwait(true);
        if (layout is not null)
            return await PrintWithBillFormatAsync(dto, layout, order.EntryType, showDialog).ConfigureAwait(true);
        return await UiThread.RunAsync(() => PrintLegacy(order, showDialog));
    }

    public static async void ShowPreview(NumberedPurchaseDocumentDto document)
    {
        await CompanyProfileService.RefreshAsync().ConfigureAwait(true);
        var dto = ApiDocumentMapper.NumberedPurchaseDocumentToSalesOrderDto(
            ApiDocumentMapper.NumberedPurchaseDocumentToPrintDto(document));
        var entryType = ApiDocumentMapper.InferPurchaseDocumentType(document);
        var docKey = BillFormatTemplateService.DocTypeKeyFromPurchaseDoc(ApiDocumentMapper.ToApiType(entryType));

        var v2 = await ReportPrintResolver.ResolveForPrintAsync(docKey, dto, "supplier").ConfigureAwait(true);
        if (v2 is not null)
        {
            await ReportGridColumnSync.ApplyOrganizationColumnVisibilityAsync(v2.Layout, docKey)
                .ConfigureAwait(true);
            await ReportPrintEngine.ShowPreviewAsync(dto, v2, entryType: null, partyLabel: "Supplier")
                .ConfigureAwait(true);
            return;
        }

        var layout = await ResolveBillFormatLayoutAsync(entryType, dto).ConfigureAwait(true);
        if (layout is not null)
        {
            await BillFormatGridColumnSync.ApplyOrganizationColumnVisibilityForPrintAsync(layout, docKey)
                .ConfigureAwait(true);
            SalesBillFlowDocumentRenderer.ShowPreview(dto, layout, entryType: null);
        }
        else
            ShowPreviewLegacy(document);
    }

    /// <summary>After saving a purchase document, preview or auto-print per Bill Format Master settings.</summary>
    public static async Task RunAfterSavePrintActionsAsync(SalesOrderDto dto, PurchaseEntryType entryType)
    {
        if (!ImsApiClient.IsAvailable)
            return;

        await CompanyProfileService.RefreshAsync().ConfigureAwait(true);
        var docKey = BillFormatTemplateService.DocTypeKeyFromPurchaseDoc(ApiDocumentMapper.ToApiType(entryType));

        var v2 = await ReportPrintResolver.ResolveForPrintAsync(docKey, dto, "supplier").ConfigureAwait(true);
        if (v2 is not null)
        {
            if (v2.PrintSettings.PrintPreview)
            {
                await ReportPrintEngine.ShowPreviewAsync(dto, v2, entryType: null, partyLabel: "Supplier")
                    .ConfigureAwait(true);
                return;
            }

            if (v2.PrintSettings.AutoPrintAfterSave)
                await PrintAsync(dto, entryType, showDialog: false).ConfigureAwait(true);
            return;
        }

        var layout = await ResolveBillFormatLayoutAsync(entryType, dto).ConfigureAwait(true);
        if (layout is null)
            return;

        if (layout.PrintSettings.PrintPreview)
        {
            await UiThread.RunAsync(() => SalesBillFlowDocumentRenderer.ShowPreview(dto, layout, entryType: null));
            return;
        }

        if (layout.PrintSettings.AutoPrintAfterSave)
            await PrintAsync(dto, entryType, showDialog: false).ConfigureAwait(true);
    }

    private static async Task<bool> PrintAsync(SalesOrderDto dto, PurchaseEntryType entryType, bool showDialog)
    {
        var layout = await ResolveBillFormatLayoutAsync(entryType, dto).ConfigureAwait(true);
        if (layout is not null)
            return await PrintWithBillFormatAsync(dto, layout, entryType, showDialog).ConfigureAwait(true);
        return false;
    }

    private static async Task<bool> PrintWithBillFormatAsync(
        SalesOrderDto dto,
        SalesBillLayoutDefinition layout,
        PurchaseEntryType entryType,
        bool showDialog)
    {
        var docKey = BillFormatTemplateService.DocTypeKeyFromPurchaseDoc(ApiDocumentMapper.ToApiType(entryType));

        var v2 = await ReportPrintResolver.ResolveForPrintAsync(docKey, dto, "supplier").ConfigureAwait(true);
        if (v2 is not null)
        {
            await ReportGridColumnSync.ApplyOrganizationColumnVisibilityAsync(v2.Layout, docKey)
                .ConfigureAwait(true);
            return await UiThread.RunAsync(() =>
                ReportPrintEngine.Print(dto, v2, showDialog, entryType: null, partyLabel: "Supplier"));
        }

        await BillFormatGridColumnSync.ApplyOrganizationColumnVisibilityForPrintAsync(layout, docKey)
            .ConfigureAwait(true);
        return await UiThread.RunAsync(() =>
            SalesBillFlowDocumentRenderer.Print(dto, layout, showDialog, entryType: null));
    }

    private static async Task<SalesBillLayoutDefinition?> ResolveBillFormatLayoutAsync(
        PurchaseEntryType entryType,
        SalesOrderDto dto)
    {
        var docKey = BillFormatTemplateService.DocTypeKeyFromPurchaseDoc(ApiDocumentMapper.ToApiType(entryType));
        return await BillFormatPrintResolver.ResolveLayoutForPrintAsync(docKey, dto, "supplier")
            .ConfigureAwait(true);
    }

    private static void ShowPreviewLegacy(NumberedPurchaseDocumentDto document)
    {
        var layout = PrintSettingsService.Instance.GetPageLayout();
        var type = ApiDocumentMapper.InferPurchaseDocumentType(document);
        var title = document.DocumentTitle ?? PurchaseEntryCatalog.GetPrintHeaderTitle(type);
        var docNo = document.FormattedDocNo ?? $"{document.DocPrefix}-{document.DocNo}";
        var flow = BuildLegacyDocument(CreateTempForm(document));

        var window = new Window
        {
            Title = $"{title} — {docNo} ({layout.FormatName})",
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
        var printBtn = new Button { Content = "Print…", Padding = new Thickness(18, 6, 18, 6), Margin = new Thickness(0, 0, 8, 0) };
        printBtn.Click += (_, _) =>
        {
            var temp = CreateTempForm(document);
            PrintLegacy(temp, showDialog: true);
        };
        var closeBtn = new Button { Content = "Close", Padding = new Thickness(18, 6, 18, 6), IsCancel = true };
        closeBtn.Click += (_, _) => window.Close();
        buttons.Children.Add(printBtn);
        buttons.Children.Add(closeBtn);
        DockPanel.SetDock(buttons, Dock.Left);
        toolbar.Children.Add(buttons);

        var viewer = new FlowDocumentScrollViewer
        {
            Document = flow,
            Width = layout.PageSizeDips.Width,
            Height = layout.PageSizeDips.Height
        };
        var surface = new Border
        {
            Background = Brushes.White,
            BorderBrush = Brushes.Gray,
            BorderThickness = new Thickness(1),
            Child = viewer,
            Width = layout.PageSizeDips.Width,
            Height = layout.PageSizeDips.Height
        };
        root.Children.Add(toolbar);
        root.Children.Add(new Viewbox
        {
            Stretch = Stretch.Uniform,
            StretchDirection = StretchDirection.DownOnly,
            Margin = new Thickness(16),
            Child = surface
        });
        window.Content = root;
        window.ShowDialog();
    }

    public static bool PrintLegacy(PurchaseEntryFormViewModelBase order, bool showDialog = true)
    {
        var printSettings = PrintSettingsService.Instance;
        var pageSize = printSettings.GetPageSizeDips();
        var padding = printSettings.GetPagePaddingDips();
        var contentWidth = Math.Max(1, pageSize.Width - padding.Left - padding.Right);

        var document = BuildLegacyDocument(order);
        document.PageWidth = pageSize.Width;
        document.PageHeight = pageSize.Height;
        document.PagePadding = padding;
        document.ColumnWidth = contentWidth;

        var printDialog = new PrintDialog();

        if (showDialog && printDialog.ShowDialog() != true)
            return false;

        ApplyPageSizeToPrintDialog(printDialog, pageSize);

        var printableWidth = printDialog.PrintableAreaWidth > 0
            ? printDialog.PrintableAreaWidth
            : contentWidth;
        document.ColumnWidth = printableWidth;
        document.PageWidth = printDialog.PrintableAreaWidth > 0 ? printDialog.PrintableAreaWidth : pageSize.Width;
        document.PageHeight = printDialog.PrintableAreaHeight > 0 ? printDialog.PrintableAreaHeight : pageSize.Height;

        var title = ResolveTitle(order);
        printDialog.PrintDocument(((IDocumentPaginatorSource)document).DocumentPaginator, $"{title} {order.FormattedDocNo}");
        return true;
    }

    private static string ResolveTitle(PurchaseEntryFormViewModelBase order) =>
        PurchaseEntryCatalog.GetPrintHeaderTitle(order.EntryType);

    private static PurchaseEntryFormViewModelBase CreateTempForm(NumberedPurchaseDocumentDto dto)
    {
        var type = ApiDocumentMapper.InferPurchaseDocumentType(dto);
        var host = new MainViewModel();
        var workspace = PurchaseEntryWorkspaceFactory.Create(host, type);
        PurchaseEntryFormViewModelBase form = type switch
        {
            PurchaseEntryType.PurchaseOrder => new AddPurchaseOrderViewModel(host, (PurchaseOrderWorkspaceViewModel)workspace, 0, forEdit: true),
            PurchaseEntryType.Grn => new AddGrnViewModel(host, (GrnWorkspaceViewModel)workspace, 0, forEdit: true),
            PurchaseEntryType.PurchaseInvoice => new AddPurchaseInvoiceViewModel(host, (PurchaseInvoiceWorkspaceViewModel)workspace, 0, forEdit: true),
            _ => new AddPurchaseReturnViewModel(host, (PurchaseReturnWorkspaceViewModel)workspace, 0, forEdit: true)
        };
        if (form is PurchaseDocumentEntryViewModelBase docForm)
            docForm.ApplyFromDto(dto);
        return form;
    }

    private static void ApplyPageSizeToPrintDialog(PrintDialog dialog, Size pageSizeDips)
    {
        try
        {
            var ticket = dialog.PrintTicket ?? dialog.PrintQueue.DefaultPrintTicket;
            if (ticket is null)
                return;

            ticket.PageMediaSize = new PageMediaSize(pageSizeDips.Width, pageSizeDips.Height);
            ticket.PageOrientation = PageOrientation.Portrait;
            dialog.PrintTicket = ticket;
        }
        catch
        {
            // Some drivers reject custom sizes; FlowDocument dimensions still apply.
        }
    }

    private static FlowDocument BuildLegacyDocument(PurchaseEntryFormViewModelBase order)
    {
        var doc = new FlowDocument
        {
            FontFamily = new FontFamily("Segoe UI"),
            FontSize = 12
        };

        var def = PurchaseEntryCatalog.Get(order.EntryType);
        doc.Blocks.Add(new Paragraph(new Run(ResolveTitle(order)))
        {
            FontSize = 20,
            FontWeight = FontWeights.Bold,
            Margin = new Thickness(0, 0, 0, 4)
        });

        doc.Blocks.Add(new Paragraph(new Run($"{def.DocNoLabel}: {order.FormattedDocNo}    Date: {order.BillDate}"))
        {
            Margin = new Thickness(0, 0, 0, 2)
        });

        doc.Blocks.Add(new Paragraph(new Run($"Supplier: {order.Supplier}"))
        {
            Margin = new Thickness(0, 0, 0, 2)
        });

        if (!string.IsNullOrWhiteSpace(order.Buyer))
        {
            doc.Blocks.Add(new Paragraph(new Run($"Buyer: {order.Buyer}"))
            {
                Margin = new Thickness(0, 0, 0, 2)
            });
        }

        if (!string.IsNullOrWhiteSpace(order.SupplierDetails))
        {
            doc.Blocks.Add(new Paragraph(new Run($"Details: {order.SupplierDetails}"))
            {
                Margin = new Thickness(0, 0, 0, 12)
            });
        }
        else
        {
            doc.Blocks.Add(new Paragraph { Margin = new Thickness(0, 0, 0, 12) });
        }

        var table = new Table
        {
            CellSpacing = 0,
            BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(1)
        };

        table.Columns.Add(new TableColumn { Width = new GridLength(32) });
        table.Columns.Add(new TableColumn { Width = new GridLength(80) });
        table.Columns.Add(new TableColumn { Width = new GridLength(180) });
        table.Columns.Add(new TableColumn { Width = new GridLength(44) });
        table.Columns.Add(new TableColumn { Width = new GridLength(56) });
        table.Columns.Add(new TableColumn { Width = new GridLength(44) });
        table.Columns.Add(new TableColumn { Width = new GridLength(52) });
        table.Columns.Add(new TableColumn { Width = new GridLength(52) });
        table.Columns.Add(new TableColumn { Width = new GridLength(44) });
        table.Columns.Add(new TableColumn { Width = new GridLength(64) });

        var headerGroup = new TableRowGroup();
        var header = new TableRow { Background = new SolidColorBrush(Color.FromRgb(241, 245, 249)) };
        foreach (var text in new[] { "Sr", "Code", "Description", "Qty", "Rate", "Disc%", "Disc", "Tax", "GST%", "Amount" })
            header.Cells.Add(CreateHeaderCell(text));
        headerGroup.Rows.Add(header);
        table.RowGroups.Add(headerGroup);

        var bodyGroup = new TableRowGroup();
        foreach (var line in order.LineItems)
        {
            var row = new TableRow();
            row.Cells.Add(CreateCell(line.Sr.ToString()));
            row.Cells.Add(CreateCell(line.ProductRetailCode));
            row.Cells.Add(CreateCell(line.ItemDescription));
            row.Cells.Add(CreateCell(line.Qty, TextAlignment.Right));
            row.Cells.Add(CreateCell(line.Rate, TextAlignment.Right));
            row.Cells.Add(CreateCell(line.DiscPercent, TextAlignment.Right));
            row.Cells.Add(CreateCell(line.DiscValue, TextAlignment.Right));
            row.Cells.Add(CreateCell(line.TaxType));
            row.Cells.Add(CreateCell(line.TaxPercent, TextAlignment.Right));
            row.Cells.Add(CreateCell(line.Amount, TextAlignment.Right));
            bodyGroup.Rows.Add(row);
        }

        table.RowGroups.Add(bodyGroup);
        doc.Blocks.Add(table);

        doc.Blocks.Add(new Paragraph { Margin = new Thickness(0, 16, 0, 0) });

        AddTotalLine(doc, "Total Qty", order.TotQty);
        AddTotalLine(doc, "Gross", order.Gross);
        AddTotalLine(doc, "Discount", order.Discount);
        AddTotalLine(doc, "Sp. Discount", order.SpDiscount);
        AddTotalLine(doc, "Add Other", order.AddOther);
        AddTotalLine(doc, "Net", order.Net, bold: true);
        AddTotalLine(doc, def.AmountTotalLabel, order.OrderAmount, bold: true, large: true);

        if (!string.IsNullOrWhiteSpace(order.Narration))
            doc.Blocks.Add(new Paragraph(new Run($"Narration: {order.Narration}")) { Margin = new Thickness(0, 12, 0, 0) });

        doc.Blocks.Add(new Paragraph(new Run($"Printed: {DateTime.Now:dd/MM/yyyy HH:mm}"))
        {
            FontSize = 10,
            Foreground = Brushes.Gray,
            Margin = new Thickness(0, 16, 0, 0)
        });

        return doc;
    }

    private static TableCell CreateHeaderCell(string text) =>
        new(new Paragraph(new Run(text)) { FontWeight = FontWeights.SemiBold, Margin = new Thickness(4, 4, 4, 4) })
        {
            BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(0, 0, 1, 1),
            Padding = new Thickness(2)
        };

    private static TableCell CreateCell(string text, TextAlignment align = TextAlignment.Left) =>
        new(new Paragraph(new Run(text)) { TextAlignment = align, Margin = new Thickness(4, 3, 4, 3) })
        {
            BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(0, 0, 1, 1),
            Padding = new Thickness(2)
        };

    private static void AddTotalLine(FlowDocument doc, string label, string value, bool bold = false, bool large = false)
    {
        var p = new Paragraph { TextAlignment = TextAlignment.Right, Margin = new Thickness(0, 2, 0, 0) };
        var labelRun = new Run($"{label}: ") { FontWeight = bold ? FontWeights.SemiBold : FontWeights.Normal };
        var valueRun = new Run(value) { FontWeight = bold ? FontWeights.Bold : FontWeights.Normal };
        if (large) valueRun.FontSize = 14;
        p.Inlines.Add(labelRun);
        p.Inlines.Add(valueRun);
        doc.Blocks.Add(p);
    }
}
