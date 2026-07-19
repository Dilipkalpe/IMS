using System.Globalization;
using System.Windows;
using System.Windows.Documents;
using System.Windows.Media;
using IMS.Models;

namespace IMS.Services;

public static class LedgerReportPrintService
{
    private static readonly Brush OpeningBackground = new SolidColorBrush(Color.FromRgb(231, 241, 255));
    private static readonly Brush HighlightBackground = new SolidColorBrush(Color.FromRgb(241, 243, 246));
    private static readonly Brush ClosingAmountForeground = new SolidColorBrush(Color.FromRgb(220, 53, 69));
    private static readonly Brush FooterAmountForeground = new SolidColorBrush(Color.FromRgb(220, 53, 69));

    public static void ShowPreview(
        IReadOnlyList<LedgerReportRow> rows,
        string accountCode,
        string accountName,
        string dateFromLabel,
        string dateToLabel,
        decimal footerDebit,
        decimal footerCredit)
    {
        var document = BuildDocument(
            rows,
            accountCode,
            accountName,
            dateFromLabel,
            dateToLabel,
            footerDebit,
            footerCredit);
        InventoryReportPrintHelper.ShowPreview(
            $"Ledger Report — {accountCode} {accountName}",
            document);
    }

    private static FlowDocument BuildDocument(
        IReadOnlyList<LedgerReportRow> rows,
        string accountCode,
        string accountName,
        string dateFromLabel,
        string dateToLabel,
        decimal footerDebit,
        decimal footerCredit)
    {
        var contentWidth = InventoryReportPrintHelper.PortraitContentWidthDips();
        var subtitle =
            $"Account: {accountCode} — {accountName}  •  Date between {dateFromLabel} and {dateToLabel}  •  {rows.Count(r => !r.IsSpecial)} transaction(s)";

        var doc = InventoryReportPrintHelper.CreateDocument("Ledger Report", subtitle, contentWidth, fontSize: 11);
        var table = InventoryReportPrintHelper.CreateTable(
            new[] { 1.1, 1.1, 0.8, 2.8, 0.9, 0.9, 0.8 },
            contentWidth);

        InventoryReportPrintHelper.AddHeaderRow(
            table,
            ["Entry Date", "Entry Type", "Entry No", "Particular", "DR", "CR", "Manual No"],
            [
                TextAlignment.Left,
                TextAlignment.Left,
                TextAlignment.Left,
                TextAlignment.Left,
                TextAlignment.Right,
                TextAlignment.Right,
                TextAlignment.Left
            ]);

        var body = InventoryReportPrintHelper.AddBodyGroup(table);
        foreach (var row in rows)
        {
            var tr = new TableRow();
            if (row.IsOpening)
                tr.Background = OpeningBackground;
            else if (row.IsTotal || row.IsClosing)
                tr.Background = HighlightBackground;

            var bold = row.IsOpening || row.IsTotal || row.IsClosing;
            InventoryReportPrintHelper.AddCell(tr, row.EntryDate, semiBold: bold, bold: row.IsClosing);
            InventoryReportPrintHelper.AddCell(tr, row.EntryType, semiBold: bold);
            InventoryReportPrintHelper.AddCell(tr, row.EntryNo, semiBold: bold);
            InventoryReportPrintHelper.AddCell(tr, row.Particular, semiBold: bold, bold: row.IsClosing);

            if (row.IsClosing)
            {
                AddAmountCell(tr, row.DrDisplay, bold: true);
                AddAmountCell(tr, row.CrDisplay, bold: true, emphasize: true);
            }
            else
            {
                InventoryReportPrintHelper.AddCell(tr, row.DrDisplay, TextAlignment.Right, semiBold: bold, bold: bold);
                InventoryReportPrintHelper.AddCell(tr, row.CrDisplay, TextAlignment.Right, semiBold: bold, bold: bold);
            }

            InventoryReportPrintHelper.AddCell(tr, row.ManualNo, semiBold: bold);
            body.Rows.Add(tr);
        }

        doc.Blocks.Add(table);

        var footer = new Table
        {
            CellSpacing = 0,
            Margin = new Thickness(0, 12, 0, 0),
            BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(0)
        };
        footer.Columns.Add(new TableColumn { Width = new GridLength(contentWidth * 0.55) });
        footer.Columns.Add(new TableColumn { Width = new GridLength(contentWidth * 0.15) });
        footer.Columns.Add(new TableColumn { Width = new GridLength(contentWidth * 0.15) });
        footer.Columns.Add(new TableColumn { Width = new GridLength(contentWidth * 0.075) });
        footer.Columns.Add(new TableColumn { Width = new GridLength(contentWidth * 0.075) });

        var footerGroup = new TableRowGroup();
        var footerRow = new TableRow { Background = HighlightBackground };
        InventoryReportPrintHelper.AddCell(footerRow, string.Empty);
        InventoryReportPrintHelper.AddCell(footerRow, "Debit", TextAlignment.Right, semiBold: true);
        AddAmountCell(footerRow, FormatMoney(footerDebit), bold: true, emphasize: true);
        InventoryReportPrintHelper.AddCell(footerRow, "Credit", TextAlignment.Right, semiBold: true);
        AddAmountCell(footerRow, FormatMoney(footerCredit), bold: true, emphasize: true);
        footerGroup.Rows.Add(footerRow);
        footer.RowGroups.Add(footerGroup);
        doc.Blocks.Add(footer);

        InventoryReportPrintHelper.AddFooterPrintedAt(doc);
        return doc;
    }

    private static void AddAmountCell(TableRow row, string text, bool bold = false, bool emphasize = false)
    {
        var para = new Paragraph(new Run(text ?? string.Empty))
        {
            TextAlignment = TextAlignment.Right,
            Margin = new Thickness(5, 4, 5, 4),
            Foreground = emphasize ? FooterAmountForeground : Brushes.Black,
            FontWeight = bold ? FontWeights.Bold : FontWeights.Normal
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
