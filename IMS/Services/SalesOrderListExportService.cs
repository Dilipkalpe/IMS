using System.Globalization;
using System.IO;
using System.Text;
using IMS.Models;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using Microsoft.Win32;

namespace IMS.Services;

public static class SalesOrderListExportService
{
    public static async Task ExportCurrentPageToExcelAsync(IReadOnlyList<SalesOrderListRow> rows, IReadOnlyList<string> visibleKeys)
    {
        if (rows.Count == 0)
            return;

        var dlg = new SaveFileDialog
        {
            Filter = "Excel CSV (*.csv)|*.csv",
            FileName = $"SalesOrders_{DateTime.Now:yyyyMMdd_HHmm}.csv",
            Title = "Export Sales Orders"
        };

        if (dlg.ShowDialog() != true)
            return;

        var columns = BuildExportColumns(visibleKeys);
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",", columns.Select(c => Escape(c.Header))));

        foreach (var row in rows)
        {
            var values = columns.Select(c => Escape(c.Value(row)));
            sb.AppendLine(string.Join(",", values));
        }

        await File.WriteAllTextAsync(dlg.FileName, sb.ToString(), new UTF8Encoding(encoderShouldEmitUTF8Identifier: true));
    }

    public static async Task<IReadOnlyList<SalesOrderListRow>> FetchAllFilteredAsync(
        string? search,
        string? status,
        string? sort,
        string? sortDir,
        IProgress<int>? progress = null)
    {
        var all = new List<SalesOrderListRow>();
        var page = 1;
        const int limit = 500;
        var total = int.MaxValue;

        while (all.Count < total)
        {
            var (items, count) = await ImsApiClient.GetSalesOrdersPageAsync(
                search, status, page, limit, sort, sortDir);
            total = count;
            if (items.Count == 0)
                break;

            var start = all.Count;
            for (var i = 0; i < items.Count; i++)
                all.Add(SalesOrderListMapper.ToRow(items[i], start + i + 1));

            progress?.Report(all.Count);
            if (items.Count < limit)
                break;
            page++;
        }

        return all;
    }

    public static List<(string Header, Func<SalesOrderListRow, string> Value)> BuildExportColumnsForPrint(
        IReadOnlyList<string> visibleKeys) => BuildExportColumns(visibleKeys);

    private static List<(string Header, Func<SalesOrderListRow, string> Value)> BuildExportColumns(
        IReadOnlyList<string> visibleKeys)
    {
        var map = new Dictionary<string, (string, Func<SalesOrderListRow, string>)>(StringComparer.OrdinalIgnoreCase)
        {
            ["soNo"] = ("SO No", r => r.SoNo),
            ["soDate"] = ("SO Date", r => r.SoDate),
            ["customer"] = ("Customer", r => r.Customer),
            ["totalTaxable"] = ("Total Taxable Amount", r => r.TotalTaxableDisplay),
            ["totalCgst"] = ("Total CGST", r => r.TotalCgstDisplay),
            ["totalSgst"] = ("Total SGST", r => r.TotalSgstDisplay),
            ["totalIgst"] = ("Total IGST", r => r.TotalIgstDisplay),
            ["totalDiscount"] = ("Total Discount", r => r.TotalDiscountDisplay),
            ["salesAmt"] = ("Sales Amt", r => r.SalesAmountDisplay),
            ["paidAmt"] = ("Paid Amt", r => r.PaidAmountDisplay),
            ["balance"] = ("Balance", r => r.BalanceDisplay),
            ["status"] = ("Status", r => r.Status)
        };

        var cols = new List<(string, Func<SalesOrderListRow, string>)> { ("Sr.", r => r.SerialNo.ToString(CultureInfo.InvariantCulture)) };
        foreach (var key in visibleKeys)
        {
            if (map.TryGetValue(key, out var col))
                cols.Add(col);
        }

        return cols;
    }

    private static string Escape(string? value)
    {
        var text = value ?? string.Empty;
        if (text.Contains('"') || text.Contains(',') || text.Contains('\n'))
            return $"\"{text.Replace("\"", "\"\"")}\"";
        return text;
    }
}
