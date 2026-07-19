// Print engine sample — ERP.Reporting.Print/

using System.Printing;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using ERP.Reporting.Core;

namespace ERP.Reporting.Print;

public sealed class WpfPrintEngine : IPrintEngine
{
    public void ShowPreview(RenderedReportDocument document, string title)
    {
        var window = new Window
        {
            Title = $"{title} — Print preview",
            Width = 900,
            Height = 700,
            WindowStartupLocation = WindowStartupLocation.CenterScreen,
            Owner = Application.Current?.MainWindow
        };

        var viewer = new DocumentViewer
        {
            Document = document.PaginatorSource as IDocumentPaginatorSource
        };

        window.Content = viewer;
        window.ShowDialog();
    }

    public bool Print(RenderedReportDocument document, string jobName, int copies, bool showDialog)
    {
        var dlg = new PrintDialog();
        ApplyPageSize(dlg, document.Page);

        if (showDialog && dlg.ShowDialog() != true)
            return false;

        if (copies > 1 && dlg.PrintTicket is not null)
            dlg.PrintTicket.CopyCount = copies;

        dlg.PrintDocument(
            (document.PaginatorSource as IDocumentPaginatorSource)!.DocumentPaginator,
            jobName);

        return true;
    }

    public Task ExportPdfAsync(RenderedReportDocument document, string filePath, CancellationToken ct = default)
    {
        // Plug IPdfExportService: XPS → PDF, or dedicated PDF library behind interface.
        // Keeps core free of vendor lock-in.
        return Task.FromException(new NotImplementedException(
            "Implement IPdfExportService and register in DI."));
    }

    private static void ApplyPageSize(PrintDialog dlg, PageDimensions page)
    {
        var widthDip = page.WidthMm / 25.4 * 96;
        var heightDip = page.HeightMm / 25.4 * 96;
        try
        {
            if (dlg.PrintTicket is null)
                return;
            dlg.PrintTicket.PageMediaSize = new PageMediaSize(widthDip, heightDip);
            dlg.PrintTicket.PageOrientation = PageOrientation.Portrait;
        }
        catch
        {
            // Driver may reject custom size.
        }
    }
}
