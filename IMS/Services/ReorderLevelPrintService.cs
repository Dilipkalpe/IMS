using System.Globalization;
using System.Windows;
using System.Windows.Documents;
using System.Windows.Media;
using IMS.Models;

namespace IMS.Services;

public static class ReorderLevelPrintService
{
    private static readonly Brush HighlightBackground = new SolidColorBrush(Color.FromRgb(241, 243, 246));
    private static readonly Brush AlertForeground = new SolidColorBrush(Color.FromRgb(220, 53, 69));

    public static void ShowPreview(
        IReadOnlyList<ReorderLevelRow> rows,
        decimal totalOnHand,
        decimal totalReorder,
        decimal totalShortage,
        string? productCode,
        string? productName)
    {
        var document = BuildDocument(rows, totalOnHand, totalReorder, totalShortage, productCode, productName);
        InventoryReportPrintHelper.ShowPreview("Reorder Level Report", document);
    }

    private static FlowDocument BuildDocument(
        IReadOnlyList<ReorderLevelRow> rows,
        decimal totalOnHand,
        decimal totalReorder,
        decimal totalShortage,
        string? productCode,
        string? productName)
    {
        var contentWidth = InventoryReportPrintHelper.LandscapeContentWidthDips();
        var filters = new List<string>();
        if (!string.IsNullOrWhiteSpace(productCode)) filters.Add($"Code: {productCode}");
        if (!string.IsNullOrWhiteSpace(productName)) filters.Add($"Name: {productName}");
        var filterText = filters.Count == 0 ? "All products" : string.Join("  •  ", filters);
        var subtitle = $"{filterText}  •  {rows.Count} row(s)";

        var doc = InventoryReportPrintHelper.CreateDocument("Reorder Level Report", subtitle, contentWidth, fontSize: 11);
        var table = InventoryReportPrintHelper.CreateTable(
            new[] { 0.5, 1.1, 3.0, 0.7, 1.0, 1.0, 1.0, 1.2 },
            contentWidth);

        InventoryReportPrintHelper.AddHeaderRow(
            table,
            ["#", "Product ID", "Product Name", "Unit", "On Hand", "Reorder", "Shortage", "Status"],
            [
                TextAlignment.Center, TextAlignment.Left, TextAlignment.Left, TextAlignment.Center,
                TextAlignment.Right, TextAlignment.Right, TextAlignment.Right, TextAlignment.Left
            ]);

        var body = InventoryReportPrintHelper.AddBodyGroup(table);
        foreach (var row in rows)
        {
            var tr = new TableRow();
            InventoryReportPrintHelper.AddCell(tr, row.SerialNo.ToString(), TextAlignment.Center);
            InventoryReportPrintHelper.AddCell(tr, row.ProductId);
            InventoryReportPrintHelper.AddCell(tr, row.ProductName);
            InventoryReportPrintHelper.AddCell(tr, row.Unit, TextAlignment.Center);
            InventoryReportPrintHelper.AddCell(tr, row.OnHandDisplay, TextAlignment.Right);
            InventoryReportPrintHelper.AddCell(tr, row.ReorderLevelDisplay, TextAlignment.Right);
            InventoryReportPrintHelper.AddCell(tr, row.ShortageDisplay, TextAlignment.Right, semiBold: row.Shortage > 0);
            InventoryReportPrintHelper.AddCell(tr, row.Status);
            body.Rows.Add(tr);
        }

        var totalRow = new TableRow { Background = HighlightBackground };
        InventoryReportPrintHelper.AddCell(totalRow, string.Empty);
        InventoryReportPrintHelper.AddCell(totalRow, string.Empty);
        InventoryReportPrintHelper.AddCell(totalRow, "Total :", semiBold: true);
        InventoryReportPrintHelper.AddCell(totalRow, string.Empty);
        InventoryReportPrintHelper.AddCell(totalRow, FormatQty(totalOnHand), TextAlignment.Right, bold: true);
        InventoryReportPrintHelper.AddCell(totalRow, FormatQty(totalReorder), TextAlignment.Right, bold: true);
        AddAlertCell(totalRow, FormatQty(totalShortage));
        InventoryReportPrintHelper.AddCell(totalRow, string.Empty);
        body.Rows.Add(totalRow);

        doc.Blocks.Add(table);
        InventoryReportPrintHelper.AddFooterPrintedAt(doc);
        return doc;
    }

    private static void AddAlertCell(TableRow row, string text)
    {
        var para = new Paragraph(new Run(text))
        {
            TextAlignment = TextAlignment.Right,
            Margin = new Thickness(5, 4, 5, 4),
            Foreground = AlertForeground,
            FontWeight = FontWeights.Bold
        };
        row.Cells.Add(new TableCell(para)
        {
            BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(0.5)
        });
    }

    private static string FormatQty(decimal value) =>
        value % 1 == 0 ? value.ToString("N0", CultureInfo.CurrentCulture) : value.ToString("N2", CultureInfo.CurrentCulture);
}
