using System.Windows;
using System.Windows.Documents;
using IMS.Models;

namespace IMS.Services;

public static class SalesOrderListPrintService
{
    public static void ShowPreview(
        IReadOnlyList<SalesOrderListRow> rows,
        IReadOnlyList<string> visibleKeys,
        string subtitle)
    {
        var doc = BuildDocument(rows, visibleKeys, subtitle);
        InventoryReportPrintHelper.ShowPreview("Sales Order List", doc);
    }

    public static void Print(
        IReadOnlyList<SalesOrderListRow> rows,
        IReadOnlyList<string> visibleKeys,
        string subtitle)
    {
        var doc = BuildDocument(rows, visibleKeys, subtitle);
        var dlg = new System.Windows.Controls.PrintDialog();
        if (dlg.ShowDialog() != true)
            return;
        doc.PageWidth = dlg.PrintableAreaWidth;
        doc.PageHeight = dlg.PrintableAreaHeight;
        doc.ColumnWidth = dlg.PrintableAreaWidth;
        dlg.PrintDocument(((IDocumentPaginatorSource)doc).DocumentPaginator, "Sales Order List");
    }

    private static FlowDocument BuildDocument(
        IReadOnlyList<SalesOrderListRow> rows,
        IReadOnlyList<string> visibleKeys,
        string subtitle)
    {
        var columns = SalesOrderListExportService.BuildExportColumnsForPrint(visibleKeys);
        var contentWidth = InventoryReportPrintHelper.LandscapeContentWidthDips();
        var doc = InventoryReportPrintHelper.CreateDocument("Sales Order List", subtitle, contentWidth, fontSize: 10);
        var weights = Enumerable.Repeat(1.0, columns.Count).ToList();
        var table = InventoryReportPrintHelper.CreateTable(weights, contentWidth);
        InventoryReportPrintHelper.AddHeaderRow(table, columns.Select(c => c.Header).ToArray());

        var body = InventoryReportPrintHelper.AddBodyGroup(table);
        foreach (var row in rows)
        {
            var tr = new TableRow();
            foreach (var col in columns)
                InventoryReportPrintHelper.AddCell(tr, col.Value(row), TextAlignment.Left);
            body.Rows.Add(tr);
        }

        doc.Blocks.Add(table);
        InventoryReportPrintHelper.AddFooterPrintedAt(doc);
        return doc;
    }
}
