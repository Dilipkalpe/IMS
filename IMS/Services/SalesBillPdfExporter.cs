using System.IO;
using System.Windows;
using System.Windows.Documents;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using IMS.Models;
using IMS.Services.Api.Dtos;
using Microsoft.Win32;
using PdfSharp.Drawing;
using PdfSharp.Pdf;

namespace IMS.Services;

public static class SalesBillPdfExporter
{
    public static void ExportWithSaveDialog(
        SalesOrderDto order,
        SalesBillLayoutDefinition layout,
        SalesEntryType? entryType = null)
    {
        var invoiceNo = order.FormattedDocNo ?? order.DocNo.ToString();

        var dialog = new SaveFileDialog
        {
            Filter = "PDF files (*.pdf)|*.pdf",
            FileName = $"{invoiceNo.Replace('/', '-')}.pdf",
            Title = "Export sales bill as PDF"
        };

        if (dialog.ShowDialog() != true)
            return;

        Export(order, layout, dialog.FileName, entryType);
        MessageBox.Show($"PDF saved to:\n{dialog.FileName}", "PDF Export", MessageBoxButton.OK, MessageBoxImage.Information);
    }

    public static void Export(
        SalesOrderDto order,
        SalesBillLayoutDefinition layout,
        string filePath,
        SalesEntryType? entryType = null)
    {
        var document = SalesBillFlowDocumentRenderer.BuildDocument(
            order,
            layout,
            CompanyProfileService.Current,
            entryType);

        var pageSize = SalesBillLayoutHelper.PageSizeDips(layout.Page);
        var paginator = ((IDocumentPaginatorSource)document).DocumentPaginator;
        paginator.PageSize = pageSize;

        var pdf = new PdfDocument();
        pdf.Info.Title = $"Sales Bill {order.FormattedDocNo}";

        var pageCount = paginator.PageCount;
        for (var i = 0; i < pageCount; i++)
        {
            var pdfPage = pdf.AddPage();
            pdfPage.Width = XUnit.FromPoint(pageSize.Width * 72 / 96);
            pdfPage.Height = XUnit.FromPoint(pageSize.Height * 72 / 96);

            using var gfx = XGraphics.FromPdfPage(pdfPage);
            var docPage = paginator.GetPage(i);
            if (docPage.Visual is not UIElement element)
                continue;

            RenderVisualToPdf(gfx, element, pdfPage.Width.Point, pdfPage.Height.Point);
        }

        var dir = Path.GetDirectoryName(filePath);
        if (!string.IsNullOrEmpty(dir))
            Directory.CreateDirectory(dir);
        pdf.Save(filePath);
    }

    private static void RenderVisualToPdf(XGraphics gfx, UIElement visual, double widthPt, double heightPt)
    {
        var widthDip = widthPt * 96 / 72;
        var heightDip = heightPt * 96 / 72;
        var rtb = new RenderTargetBitmap(
            (int)Math.Ceiling(widthDip),
            (int)Math.Ceiling(heightDip),
            96,
            96,
            PixelFormats.Pbgra32);

        visual.Measure(new Size(widthDip, heightDip));
        visual.Arrange(new Rect(0, 0, widthDip, heightDip));
        visual.UpdateLayout();
        rtb.Render(visual);

        var encoder = new PngBitmapEncoder();
        encoder.Frames.Add(BitmapFrame.Create(rtb));
        using var ms = new MemoryStream();
        encoder.Save(ms);
        ms.Position = 0;

        using var ximg = XImage.FromStream(ms);
        gfx.DrawImage(ximg, 0, 0, widthPt, heightPt);
    }
}
