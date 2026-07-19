using System.Windows;
using System.Windows.Documents;
using System.Windows.Media;
using IMS.Models;

namespace IMS.Services;

public static class OpeningStockPrintService
{
    public static void ShowPreview(
        IReadOnlyList<OpeningStockRow> rows,
        decimal totalQty,
        decimal totalValuation,
        string dateLabel,
        string? productCode,
        string? productName,
        string? mainName,
        string? productType)
    {
        var document = BuildDocument(rows, totalQty, totalValuation, dateLabel, productCode, productName, mainName, productType);
        InventoryReportPrintHelper.ShowPreview($"Opening Stock Report — {dateLabel}", document);
    }

    private static FlowDocument BuildDocument(
        IReadOnlyList<OpeningStockRow> rows,
        decimal totalQty,
        decimal totalValuation,
        string dateLabel,
        string? productCode,
        string? productName,
        string? mainName,
        string? productType)
    {
        var contentWidth = InventoryReportPrintHelper.PortraitContentWidthDips();
        var filterParts = new List<string>();
        if (!string.IsNullOrWhiteSpace(productCode)) filterParts.Add($"Code: {productCode}");
        if (!string.IsNullOrWhiteSpace(productName)) filterParts.Add($"Name: {productName}");
        if (!string.IsNullOrWhiteSpace(mainName) && !string.Equals(mainName, "(All)", StringComparison.OrdinalIgnoreCase))
            filterParts.Add($"Main: {mainName}");
        if (!string.IsNullOrWhiteSpace(productType) && !string.Equals(productType, "(All)", StringComparison.OrdinalIgnoreCase))
            filterParts.Add($"Type: {productType}");

        var filterText = filterParts.Count > 0 ? string.Join("  •  ", filterParts) : "All products";
        var subtitle = $"As on: {dateLabel}  •  {filterText}  •  {rows.Count} row(s)";

        var doc = InventoryReportPrintHelper.CreateDocument("Opening Stock Report", subtitle, contentWidth, fontSize: 11);
        var table = InventoryReportPrintHelper.CreateTable(
            new[] { 0.6, 1.4, 4.2, 0.9, 1.3, 1.1, 1.1, 1.4 },
            contentWidth);

        var headerAlign = new[]
        {
            TextAlignment.Center,
            TextAlignment.Left,
            TextAlignment.Left,
            TextAlignment.Left,
            TextAlignment.Left,
            TextAlignment.Right,
            TextAlignment.Right,
            TextAlignment.Right
        };
        InventoryReportPrintHelper.AddHeaderRow(
            table,
            new[] { "#", "ITEM ID", "Item Name", "Unit", "Date", "Qty", "Rate", "Valuation" },
            headerAlign);

        var body = InventoryReportPrintHelper.AddBodyGroup(table);
        foreach (var row in rows)
        {
            var tr = new TableRow();
            InventoryReportPrintHelper.AddCell(tr, row.SerialNo.ToString(), TextAlignment.Center);
            InventoryReportPrintHelper.AddCell(tr, row.ItemId);
            InventoryReportPrintHelper.AddCell(tr, row.ItemName);
            InventoryReportPrintHelper.AddCell(tr, row.Unit);
            InventoryReportPrintHelper.AddCell(tr, row.Date);
            InventoryReportPrintHelper.AddCell(tr, row.QtyDisplay, TextAlignment.Right);
            InventoryReportPrintHelper.AddCell(tr, row.RateDisplay, TextAlignment.Right);
            InventoryReportPrintHelper.AddCell(tr, row.ValuationDisplay, TextAlignment.Right);
            body.Rows.Add(tr);
        }

        var totalRow = new TableRow { Background = Brushes.WhiteSmoke };
        InventoryReportPrintHelper.AddCell(totalRow, string.Empty);
        InventoryReportPrintHelper.AddCell(totalRow, string.Empty);
        InventoryReportPrintHelper.AddCell(totalRow, "Total", semiBold: true);
        InventoryReportPrintHelper.AddCell(totalRow, string.Empty);
        InventoryReportPrintHelper.AddCell(totalRow, string.Empty);
        InventoryReportPrintHelper.AddCell(totalRow, FormatQty(totalQty), TextAlignment.Right, bold: true);
        InventoryReportPrintHelper.AddCell(totalRow, string.Empty);
        InventoryReportPrintHelper.AddCell(totalRow, FormatMoney(totalValuation), TextAlignment.Right, bold: true);
        body.Rows.Add(totalRow);

        doc.Blocks.Add(table);
        InventoryReportPrintHelper.AddFooterPrintedAt(doc);
        return doc;
    }

    private static string FormatQty(decimal value) =>
        value % 1 == 0 ? value.ToString("N0") : value.ToString("N2");

    private static string FormatMoney(decimal value) =>
        value % 1 == 0 ? value.ToString("N0") : value.ToString("N2");
}
