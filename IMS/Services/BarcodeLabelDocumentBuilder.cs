using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Markup;
using System.Windows.Media;
using IMS.Models;

namespace IMS.Services;

public static class BarcodeLabelDocumentBuilder
{
    private const double MmToDip = 96.0 / 25.4;
    private static readonly Size A4SizeDip = new(210 * MmToDip, 297 * MmToDip);
    private static readonly Thickness PageMarginDip = new(8 * MmToDip);

    public static FixedDocument BuildFixedDocument(
        IReadOnlyList<BarcodeLabelItem> labels,
        BarcodeLabelFormat format,
        BarcodeLabelSymbology symbology = BarcodeLabelSymbology.Code128)
    {
        var doc = new FixedDocument();
        var labelWidth = format.WidthMm * MmToDip;
        var labelHeight = format.HeightMm * MmToDip;
        var usableWidth = A4SizeDip.Width - PageMarginDip.Left - PageMarginDip.Right;
        var usableHeight = A4SizeDip.Height - PageMarginDip.Top - PageMarginDip.Bottom;
        var cols = Math.Max(1, format.ColumnsPerPage);
        var rows = Math.Max(1, format.RowsPerPage);
        var gap = 2 * MmToDip;
        var cellWidth = (usableWidth - gap * (cols - 1)) / cols;
        var cellHeight = (usableHeight - gap * (rows - 1)) / rows;
        var labelsPerPage = cols * rows;

        for (var pageIndex = 0; pageIndex * labelsPerPage < labels.Count; pageIndex++)
        {
            var page = new FixedPage
            {
                Width = A4SizeDip.Width,
                Height = A4SizeDip.Height,
                Background = Brushes.White
            };

            for (var slot = 0; slot < labelsPerPage; slot++)
            {
                var labelIndex = pageIndex * labelsPerPage + slot;
                if (labelIndex >= labels.Count)
                    break;

                var col = slot % cols;
                var row = slot / cols;
                var left = PageMarginDip.Left + col * (cellWidth + gap);
                var top = PageMarginDip.Top + row * (cellHeight + gap);

                var border = CreateLabelVisual(
                    labels[labelIndex],
                    Math.Min(labelWidth, cellWidth - 2),
                    Math.Min(labelHeight, cellHeight - 2),
                    symbology);
                FixedPage.SetLeft(border, left);
                FixedPage.SetTop(border, top);
                page.Children.Add(border);
            }

            var pageContent = new PageContent();
            ((IAddChild)pageContent).AddChild(page);
            doc.Pages.Add(pageContent);
        }

        return doc;
    }

    public static void SavePdf(
        IReadOnlyList<BarcodeLabelItem> labels,
        BarcodeLabelFormat format,
        string filePath,
        BarcodeLabelSymbology symbology = BarcodeLabelSymbology.Code128) =>
        BarcodeLabelPdfExporter.Save(labels, format, filePath, symbology);

    private static Border CreateLabelVisual(
        BarcodeLabelItem item,
        double width,
        double height,
        BarcodeLabelSymbology symbology)
    {
        var border = new Border
        {
            Width = width,
            Height = height,
            BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(0.5),
            Padding = new Thickness(4, 3, 4, 3),
            Background = Brushes.White
        };

        var stack = new StackPanel();
        var isQr = symbology == BarcodeLabelSymbology.QrCode;
        var symbolHeight = isQr ? Math.Min(72, height * 0.45) : Math.Min(48, height * 0.35);
        var symbol = isQr
            ? BarcodeImageHelper.CreateQrCode(item.BarcodeValue, (int)symbolHeight, (int)symbolHeight)
            : BarcodeImageHelper.CreateCode128(
                item.BarcodeValue,
                (int)Math.Max(120, width - 12),
                (int)symbolHeight);

        if (symbol is not null)
        {
            stack.Children.Add(new Image
            {
                Source = symbol,
                Stretch = isQr ? Stretch.Uniform : Stretch.Fill,
                Height = symbolHeight,
                HorizontalAlignment = HorizontalAlignment.Center,
                Margin = new Thickness(0, 0, 0, 2)
            });
        }
        else
        {
            stack.Children.Add(new TextBlock
            {
                Text = "[Barcode unavailable]",
                FontSize = 8,
                Foreground = Brushes.Gray,
                HorizontalAlignment = HorizontalAlignment.Center
            });
        }

        stack.Children.Add(LabelLine(item.ProductName, 9, FontWeights.SemiBold, TextAlignment.Center, 2));
        stack.Children.Add(LabelLine($"SKU: {item.ProductCode}", 7.5, FontWeights.Normal, TextAlignment.Center));
        if (!string.IsNullOrWhiteSpace(item.BarcodeValue))
            stack.Children.Add(LabelLine(item.BarcodeValue, 7, FontWeights.Normal, TextAlignment.Center));
        if (!string.IsNullOrWhiteSpace(item.BatchNo))
            stack.Children.Add(LabelLine($"Batch: {item.BatchNo}", 7, FontWeights.Normal, TextAlignment.Center));
        if (!string.IsNullOrWhiteSpace(item.Mrp))
            stack.Children.Add(LabelLine($"MRP: ₹ {item.Mrp}", 7.5, FontWeights.SemiBold, TextAlignment.Center));
        if (!string.IsNullOrWhiteSpace(item.SalesRate))
            stack.Children.Add(LabelLine($"Sale: ₹ {item.SalesRate}", 7, FontWeights.Normal, TextAlignment.Center));
        if (!string.IsNullOrWhiteSpace(item.ManufacturingDate))
            stack.Children.Add(LabelLine($"Mfg: {item.ManufacturingDate}", 6.5, FontWeights.Normal, TextAlignment.Center));
        if (!string.IsNullOrWhiteSpace(item.ExpiryDate))
            stack.Children.Add(LabelLine($"Exp: {item.ExpiryDate}", 6.5, FontWeights.Normal, TextAlignment.Center));
        if (item.MissingBarcode)
        {
            stack.Children.Add(LabelLine(
                "No barcode — code only",
                6,
                FontWeights.Normal,
                TextAlignment.Center,
                1,
                Brushes.DarkOrange));
        }

        border.Child = stack;
        return border;
    }

    private static TextBlock LabelLine(
        string text,
        double fontSize,
        FontWeight weight,
        TextAlignment align,
        double bottomMargin = 0,
        Brush? foreground = null) =>
        new()
        {
            Text = text,
            FontSize = fontSize,
            FontWeight = weight,
            TextAlignment = align,
            TextWrapping = TextWrapping.Wrap,
            TextTrimming = TextTrimming.CharacterEllipsis,
            Foreground = foreground ?? Brushes.Black,
            Margin = new Thickness(0, 0, 0, bottomMargin)
        };
}
