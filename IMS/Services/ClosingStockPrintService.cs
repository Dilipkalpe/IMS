using System.Windows;
using System.Windows.Documents;
using System.Windows.Media;
using IMS.Models;

namespace IMS.Services;

public static class ClosingStockPrintService
{
    public static void ShowPreview(
        IReadOnlyList<ClosingStockRow> rows,
        ClosingStockRow? totals,
        string periodLabel,
        string? productCode,
        string? productName,
        string? mainName,
        string? productType,
        string? godown)
    {
        var document = BuildDocument(rows, totals, periodLabel, productCode, productName, mainName, productType, godown);
        InventoryReportPrintHelper.ShowPreview($"Closing Stock Report — {periodLabel}", document);
    }

    private static FlowDocument BuildDocument(
        IReadOnlyList<ClosingStockRow> rows,
        ClosingStockRow? totals,
        string periodLabel,
        string? productCode,
        string? productName,
        string? mainName,
        string? productType,
        string? godown)
    {
        var contentWidth = InventoryReportPrintHelper.LandscapeContentWidthDips();

        var filterParts = new List<string> { $"Period: {periodLabel}" };
        if (!string.IsNullOrWhiteSpace(productCode)) filterParts.Add($"Code: {productCode}");
        if (!string.IsNullOrWhiteSpace(productName)) filterParts.Add($"Name: {productName}");
        if (!string.IsNullOrWhiteSpace(mainName) && !string.Equals(mainName, "(All)", StringComparison.OrdinalIgnoreCase))
            filterParts.Add($"Main: {mainName}");
        if (!string.IsNullOrWhiteSpace(productType) && !string.Equals(productType, "(All)", StringComparison.OrdinalIgnoreCase))
            filterParts.Add($"Type: {productType}");
        if (!string.IsNullOrWhiteSpace(godown) && !string.Equals(godown, "ALL", StringComparison.OrdinalIgnoreCase))
            filterParts.Add($"Godown: {godown}");

        var dataRows = rows.Where(r => !IsTotalsRow(r)).ToList();
        filterParts.Add($"{dataRows.Count} row(s)");
        var subtitle = string.Join("  •  ", filterParts);

        var doc = InventoryReportPrintHelper.CreateDocument("Closing Stock Report", subtitle, contentWidth, fontSize: 10);
        var table = InventoryReportPrintHelper.CreateTable(
            new[] { 0.5, 1.1, 3.2, 0.7, 1, 1, 1, 1, 1, 1.2, 1 },
            contentWidth);

        var headerAlign = new[]
        {
            TextAlignment.Center,
            TextAlignment.Left,
            TextAlignment.Left,
            TextAlignment.Center,
            TextAlignment.Right,
            TextAlignment.Right,
            TextAlignment.Right,
            TextAlignment.Right,
            TextAlignment.Right,
            TextAlignment.Right,
            TextAlignment.Right
        };
        InventoryReportPrintHelper.AddHeaderRow(
            table,
            new[] { "#", "Product_ID", "Product_Name", "Unit", "Op_Stock", "Inward", "Outward", "Cl_Stock", "Avg_Rate", "Valuation", "ReOrder" },
            headerAlign);

        var body = InventoryReportPrintHelper.AddBodyGroup(table);
        foreach (var r in dataRows)
        {
            var tr = new TableRow();
            InventoryReportPrintHelper.AddCell(tr, r.SerialNo.ToString(), TextAlignment.Center);
            InventoryReportPrintHelper.AddCell(tr, r.ProductId);
            InventoryReportPrintHelper.AddCell(tr, r.ProductName);
            InventoryReportPrintHelper.AddCell(tr, r.Unit, TextAlignment.Center);
            InventoryReportPrintHelper.AddCell(tr, r.OpStockDisplay, TextAlignment.Right);
            InventoryReportPrintHelper.AddCell(tr, r.InwardDisplay, TextAlignment.Right);
            InventoryReportPrintHelper.AddCell(tr, r.OutwardDisplay, TextAlignment.Right);
            InventoryReportPrintHelper.AddCell(tr, r.ClosingStockDisplay, TextAlignment.Right, bold: true);
            InventoryReportPrintHelper.AddCell(tr, r.AvgRateDisplay, TextAlignment.Right);
            InventoryReportPrintHelper.AddCell(tr, r.ValuationDisplay, TextAlignment.Right);
            InventoryReportPrintHelper.AddCell(tr, r.ReorderLevelDisplay, TextAlignment.Right);
            body.Rows.Add(tr);
        }

        if (totals is not null)
        {
            var tr = new TableRow { Background = Brushes.WhiteSmoke };
            InventoryReportPrintHelper.AddCell(tr, string.Empty);
            InventoryReportPrintHelper.AddCell(tr, string.Empty);
            InventoryReportPrintHelper.AddCell(tr, totals.ProductName, semiBold: true);
            InventoryReportPrintHelper.AddCell(tr, totals.Unit, TextAlignment.Center);
            InventoryReportPrintHelper.AddCell(tr, totals.OpStockDisplay, TextAlignment.Right, bold: true);
            InventoryReportPrintHelper.AddCell(tr, totals.InwardDisplay, TextAlignment.Right, bold: true);
            InventoryReportPrintHelper.AddCell(tr, totals.OutwardDisplay, TextAlignment.Right, bold: true);
            InventoryReportPrintHelper.AddCell(tr, totals.ClosingStockDisplay, TextAlignment.Right, bold: true);
            InventoryReportPrintHelper.AddCell(tr, string.Empty);
            InventoryReportPrintHelper.AddCell(tr, totals.ValuationDisplay, TextAlignment.Right, bold: true);
            InventoryReportPrintHelper.AddCell(tr, string.Empty);
            body.Rows.Add(tr);
        }

        doc.Blocks.Add(table);
        InventoryReportPrintHelper.AddFooterPrintedAt(doc);
        return doc;
    }

    private static bool IsTotalsRow(ClosingStockRow row) =>
        row.SerialNo <= 0
        || string.Equals(row.ProductName, "Total :", StringComparison.OrdinalIgnoreCase)
        || string.Equals(row.ProductName, "Total", StringComparison.OrdinalIgnoreCase);
}
