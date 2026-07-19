using System.Windows;
using System.Windows.Documents;
using IMS.Models;

namespace IMS.Services;

internal static class DocumentRegisterPrintService
{
    public static void ShowPreview(
        string title,
        string partyColumnHeader,
        string dateFromLabel,
        string dateToLabel,
        string billNoFilter,
        IReadOnlyList<DocumentRegisterRow> rows,
        decimal totalAmount)
    {
        var subtitle = BuildSubtitle(dateFromLabel, dateToLabel, billNoFilter);
        var contentWidth = InventoryReportPrintHelper.PortraitContentWidthDips();
        var doc = InventoryReportPrintHelper.CreateDocument(title, subtitle, contentWidth, fontSize: 11);
        var table = InventoryReportPrintHelper.CreateTable(
            [0.6, 1.4, 1.0, 2.2, 1.1, 1.0],
            contentWidth);

        InventoryReportPrintHelper.AddHeaderRow(
            table,
            ["Sr", "Bill No", "Date", partyColumnHeader, "Amount", "Status"]);

        var body = InventoryReportPrintHelper.AddBodyGroup(table);
        foreach (var row in rows)
        {
            var tr = new TableRow();
            InventoryReportPrintHelper.AddCell(tr, row.SerialNo.ToString());
            InventoryReportPrintHelper.AddCell(tr, row.BillNo);
            InventoryReportPrintHelper.AddCell(tr, row.BillDate);
            InventoryReportPrintHelper.AddCell(tr, row.Party);
            InventoryReportPrintHelper.AddCell(tr, row.AmountDisplay, TextAlignment.Right);
            InventoryReportPrintHelper.AddCell(tr, row.Status);
            body.Rows.Add(tr);
        }

        var footerRow = new TableRow();
        InventoryReportPrintHelper.AddCell(footerRow, string.Empty);
        InventoryReportPrintHelper.AddCell(footerRow, "Total", semiBold: true);
        InventoryReportPrintHelper.AddCell(footerRow, string.Empty);
        InventoryReportPrintHelper.AddCell(footerRow, string.Empty);
        InventoryReportPrintHelper.AddCell(
            footerRow,
            totalAmount.ToString("N2"),
            TextAlignment.Right,
            semiBold: true);
        InventoryReportPrintHelper.AddCell(footerRow, string.Empty);
        table.RowGroups.Add(new TableRowGroup { Rows = { footerRow } });

        doc.Blocks.Add(table);
        InventoryReportPrintHelper.AddFooterPrintedAt(doc);
        InventoryReportPrintHelper.ShowPreview(title, doc);
    }

    private static string BuildSubtitle(string dateFrom, string dateTo, string billNo)
    {
        var parts = new List<string> { $"Period: {dateFrom} to {dateTo}" };
        if (!string.IsNullOrWhiteSpace(billNo))
            parts.Add($"Bill No: {billNo.Trim()}");
        return string.Join("  •  ", parts);
    }
}
