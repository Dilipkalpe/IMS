using System.Globalization;
using System.Windows;
using System.Windows.Documents;
using System.Windows.Media;
using IMS.Models;

namespace IMS.Services;

public static class TrialBalancePrintService
{
    private static readonly Brush HighlightBackground = new SolidColorBrush(Color.FromRgb(241, 243, 246));
    private static readonly Brush AmountForeground = new SolidColorBrush(Color.FromRgb(220, 53, 69));

    public static void ShowPreview(
        IReadOnlyList<TrialBalanceRow> rows,
        string dateFromLabel,
        string dateToLabel,
        decimal totalDr,
        decimal totalCr)
    {
        var document = BuildDocument(rows, dateFromLabel, dateToLabel, totalDr, totalCr);
        InventoryReportPrintHelper.ShowPreview(
            $"Trial Balance — {dateFromLabel} to {dateToLabel}",
            document);
    }

    private static FlowDocument BuildDocument(
        IReadOnlyList<TrialBalanceRow> rows,
        string dateFromLabel,
        string dateToLabel,
        decimal totalDr,
        decimal totalCr)
    {
        var contentWidth = InventoryReportPrintHelper.PortraitContentWidthDips();
        var subtitle =
            $"Date between {dateFromLabel} and {dateToLabel}  •  {rows.Count} account(s)";

        var doc = InventoryReportPrintHelper.CreateDocument("Trial Balance", subtitle, contentWidth, fontSize: 11);
        var table = InventoryReportPrintHelper.CreateTable(
            new[] { 0.5, 3.5, 1.2, 1.2 },
            contentWidth);

        InventoryReportPrintHelper.AddHeaderRow(
            table,
            ["#", "Account Name", "Dr Balance", "Cr Balance"],
            [
                TextAlignment.Center,
                TextAlignment.Left,
                TextAlignment.Right,
                TextAlignment.Right
            ]);

        var body = InventoryReportPrintHelper.AddBodyGroup(table);
        foreach (var row in rows)
        {
            var tr = new TableRow();
            InventoryReportPrintHelper.AddCell(tr, row.SerialNo.ToString(), TextAlignment.Center);
            InventoryReportPrintHelper.AddCell(tr, row.AccountName);
            InventoryReportPrintHelper.AddCell(tr, row.DrDisplay, TextAlignment.Right);
            InventoryReportPrintHelper.AddCell(tr, row.CrDisplay, TextAlignment.Right);
            body.Rows.Add(tr);
        }

        var totalRow = new TableRow { Background = HighlightBackground };
        InventoryReportPrintHelper.AddCell(totalRow, string.Empty);
        InventoryReportPrintHelper.AddCell(totalRow, "Total :", semiBold: true);
        AddTotalCell(totalRow, FormatMoney(totalDr));
        AddTotalCell(totalRow, FormatMoney(totalCr));
        body.Rows.Add(totalRow);

        doc.Blocks.Add(table);
        InventoryReportPrintHelper.AddFooterPrintedAt(doc);
        return doc;
    }

    private static void AddTotalCell(TableRow row, string text)
    {
        var para = new Paragraph(new Run(text))
        {
            TextAlignment = TextAlignment.Right,
            Margin = new Thickness(5, 4, 5, 4),
            Foreground = AmountForeground,
            FontWeight = FontWeights.Bold,
            FontSize = 12
        };
        row.Cells.Add(new TableCell(para)
        {
            BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(0.5)
        });
    }

    private static string FormatMoney(decimal value) =>
        value.ToString("N2", CultureInfo.CurrentCulture);
}
