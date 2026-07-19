using System.IO;
using System.Windows.Media.Imaging;
using IMS.Models;
using PdfSharp.Drawing;
using PdfSharp.Pdf;

namespace IMS.Services;

internal static class BarcodeLabelPdfExporter
{
    public static void Save(
        IReadOnlyList<BarcodeLabelItem> labels,
        BarcodeLabelFormat format,
        string filePath,
        BarcodeLabelSymbology symbology = BarcodeLabelSymbology.Code128)
    {
        var pdf = new PdfDocument();
        pdf.Info.Title = "Barcode Labels";

        var pageWidthPt = MmToPoints(210);
        var pageHeightPt = MmToPoints(297);
        var marginPt = MmToPoints(8);
        var cols = Math.Max(1, format.ColumnsPerPage);
        var rows = Math.Max(1, format.RowsPerPage);
        var gapPt = MmToPoints(2);
        var labelWidthPt = MmToPoints(format.WidthMm);
        var labelHeightPt = MmToPoints(format.HeightMm);
        var usableWidth = pageWidthPt - marginPt * 2;
        var usableHeight = pageHeightPt - marginPt * 2;
        var cellWidth = (usableWidth - gapPt * (cols - 1)) / cols;
        var cellHeight = (usableHeight - gapPt * (rows - 1)) / rows;
        var labelsPerPage = cols * rows;

        for (var pageIndex = 0; pageIndex * labelsPerPage < labels.Count; pageIndex++)
        {
            var page = pdf.AddPage();
            page.Width = XUnit.FromPoint(pageWidthPt);
            page.Height = XUnit.FromPoint(pageHeightPt);
            using var gfx = XGraphics.FromPdfPage(page);

            for (var slot = 0; slot < labelsPerPage; slot++)
            {
                var labelIndex = pageIndex * labelsPerPage + slot;
                if (labelIndex >= labels.Count)
                    break;

                var col = slot % cols;
                var row = slot / cols;
                var x = marginPt + col * (cellWidth + gapPt);
                var y = marginPt + row * (cellHeight + gapPt);
                DrawLabel(gfx, labels[labelIndex], x, y,
                    Math.Min(labelWidthPt, cellWidth - 2),
                    Math.Min(labelHeightPt, cellHeight - 2),
                    symbology);
            }
        }

        pdf.Save(filePath);
    }

    private static void DrawLabel(
        XGraphics gfx,
        BarcodeLabelItem item,
        double x,
        double y,
        double width,
        double height,
        BarcodeLabelSymbology symbology)
    {
        var rect = new XRect(x, y, width, height);
        gfx.DrawRectangle(XPens.Black, rect);

        var pad = 3.0;
        var cursorY = y + pad;
        var centerX = x + width / 2;
        var fontRegular = new XFont("Segoe UI", 7, XFontStyleEx.Regular);
        var fontBold = new XFont("Segoe UI", 8, XFontStyleEx.Bold);

        var isQr = symbology == BarcodeLabelSymbology.QrCode;
        var symbolSize = isQr ? Math.Min(MmToPoints(18), height * 0.4) : Math.Min(MmToPoints(12), height * 0.32);
        var symbol = isQr
            ? BarcodeImageHelper.CreateQrCode(item.BarcodeValue, (int)symbolSize, (int)symbolSize)
            : BarcodeImageHelper.CreateCode128(item.BarcodeValue, (int)width, (int)symbolSize);
        if (symbol is BitmapSource bitmap)
        {
            using var stream = EncodePng(bitmap);
            using var image = XImage.FromStream(stream);
            var drawWidth = isQr ? symbolSize : width - pad * 2;
            var drawX = isQr ? x + (width - drawWidth) / 2 : x + pad;
            gfx.DrawImage(image, drawX, cursorY, drawWidth, symbolSize);
            cursorY += symbolSize + 2;
        }
        else
        {
            DrawCentered(gfx, item.BarcodeValue, fontRegular, centerX, cursorY + 6);
            cursorY += 14;
        }

        cursorY = DrawCenteredWrapped(gfx, item.ProductName, fontBold, centerX, cursorY, width - pad * 2);
        cursorY = DrawCenteredWrapped(gfx, $"SKU: {item.ProductCode}", fontRegular, centerX, cursorY, width - pad * 2);
        if (!string.IsNullOrWhiteSpace(item.BarcodeValue))
            cursorY = DrawCenteredWrapped(gfx, item.BarcodeValue, fontRegular, centerX, cursorY, width - pad * 2);
        if (!string.IsNullOrWhiteSpace(item.BatchNo))
            cursorY = DrawCenteredWrapped(gfx, $"Batch: {item.BatchNo}", fontRegular, centerX, cursorY, width - pad * 2);
        if (!string.IsNullOrWhiteSpace(item.Mrp))
            cursorY = DrawCenteredWrapped(gfx, $"MRP: {item.Mrp}", fontBold, centerX, cursorY, width - pad * 2);
        if (!string.IsNullOrWhiteSpace(item.SalesRate))
            cursorY = DrawCenteredWrapped(gfx, $"Sale: {item.SalesRate}", fontRegular, centerX, cursorY, width - pad * 2);
        if (!string.IsNullOrWhiteSpace(item.ManufacturingDate))
            cursorY = DrawCenteredWrapped(gfx, $"Mfg: {item.ManufacturingDate}", fontRegular, centerX, cursorY, width - pad * 2);
        if (!string.IsNullOrWhiteSpace(item.ExpiryDate))
            DrawCenteredWrapped(gfx, $"Exp: {item.ExpiryDate}", fontRegular, centerX, cursorY, width - pad * 2);
    }

    private static MemoryStream EncodePng(BitmapSource bitmap)
    {
        var encoder = new PngBitmapEncoder();
        encoder.Frames.Add(BitmapFrame.Create(bitmap));
        var stream = new MemoryStream();
        encoder.Save(stream);
        stream.Position = 0;
        return stream;
    }

    private static double DrawCenteredWrapped(XGraphics gfx, string text, XFont font, double centerX, double y, double maxWidth)
    {
        foreach (var line in Wrap(gfx, text, font, maxWidth))
        {
            var size = gfx.MeasureString(line, font);
            gfx.DrawString(line, font, XBrushes.Black, centerX - size.Width / 2, y);
            y += size.Height + 1;
        }

        return y;
    }

    private static void DrawCentered(XGraphics gfx, string text, XFont font, double centerX, double y)
    {
        var size = gfx.MeasureString(text, font);
        gfx.DrawString(text, font, XBrushes.Black, centerX - size.Width / 2, y);
    }

    private static IEnumerable<string> Wrap(XGraphics gfx, string text, XFont font, double maxWidth)
    {
        var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var current = string.Empty;
        foreach (var word in words)
        {
            var test = string.IsNullOrEmpty(current) ? word : $"{current} {word}";
            if (gfx.MeasureString(test, font).Width <= maxWidth)
            {
                current = test;
                continue;
            }

            if (!string.IsNullOrEmpty(current))
                yield return current;
            current = word;
        }

        if (!string.IsNullOrEmpty(current))
            yield return current;
        if (string.IsNullOrEmpty(current))
            yield return text;
    }

    private static double MmToPoints(double mm) => mm * 72.0 / 25.4;
}
