using System.Windows;
using System.Windows.Documents;
using IMS.Models;

namespace IMS.Services;

public static class StandardListPrintService
{
    public static void ShowPreview(
        string title,
        IReadOnlyList<StandardListRow> rows,
        IReadOnlyList<ListColumnDef> allColumns,
        IReadOnlyList<string> visibleKeys,
        string subtitle)
    {
        var doc = BuildDocument(title, rows, allColumns, visibleKeys, subtitle);
        InventoryReportPrintHelper.ShowPreview(title, doc);
    }

    public static void Print(
        string title,
        IReadOnlyList<StandardListRow> rows,
        IReadOnlyList<ListColumnDef> allColumns,
        IReadOnlyList<string> visibleKeys,
        string subtitle)
    {
        var doc = BuildDocument(title, rows, allColumns, visibleKeys, subtitle);
        var dlg = new System.Windows.Controls.PrintDialog();
        if (dlg.ShowDialog() != true)
            return;
        doc.PageWidth = dlg.PrintableAreaWidth;
        doc.PageHeight = dlg.PrintableAreaHeight;
        doc.ColumnWidth = dlg.PrintableAreaWidth;
        dlg.PrintDocument(((IDocumentPaginatorSource)doc).DocumentPaginator, title);
    }

    private static FlowDocument BuildDocument(
        string title,
        IReadOnlyList<StandardListRow> rows,
        IReadOnlyList<ListColumnDef> allColumns,
        IReadOnlyList<string> visibleKeys,
        string subtitle)
    {
        var columns = StandardListExportService.BuildPrintColumns(allColumns, visibleKeys);
        var contentWidth = InventoryReportPrintHelper.LandscapeContentWidthDips();
        var doc = InventoryReportPrintHelper.CreateDocument(title, subtitle, contentWidth, fontSize: 10);
        var weights = Enumerable.Repeat(1.0, columns.Count + 1).ToList();
        var table = InventoryReportPrintHelper.CreateTable(weights, contentWidth);
        InventoryReportPrintHelper.AddHeaderRow(table, new[] { "Sr." }.Concat(columns.Select(c => c.Header)).ToArray());

        var body = InventoryReportPrintHelper.AddBodyGroup(table);
        foreach (var row in rows)
        {
            var tr = new TableRow();
            InventoryReportPrintHelper.AddCell(tr, row.SerialNo.ToString(), TextAlignment.Center);
            foreach (var col in columns)
                InventoryReportPrintHelper.AddCell(tr, col.Value(row), TextAlignment.Left);
            body.Rows.Add(tr);
        }

        doc.Blocks.Add(table);
        InventoryReportPrintHelper.AddFooterPrintedAt(doc);
        return doc;
    }
}
