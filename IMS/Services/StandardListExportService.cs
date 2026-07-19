using System.Globalization;
using System.IO;
using System.Text;
using IMS.Models;
using IMS.Services;
using Microsoft.Win32;

namespace IMS.Services;

public static class StandardListExportService
{
    public static async Task ExportToExcelAsync(
        string fileNamePrefix,
        IReadOnlyList<StandardListRow> rows,
        IReadOnlyList<ListColumnDef> allColumns,
        IReadOnlyList<string> visibleKeys)
    {
        if (rows.Count == 0)
            return;

        var dlg = new SaveFileDialog
        {
            Filter = "Excel CSV (*.csv)|*.csv",
            FileName = $"{fileNamePrefix}_{DateTime.Now:yyyyMMdd_HHmm}.csv",
            Title = "Export Data"
        };

        if (dlg.ShowDialog() != true)
            return;

        var columns = BuildColumns(allColumns, visibleKeys);
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",", columns.Select(c => Escape(c.Header))));

        foreach (var row in rows)
        {
            var values = columns.Select(c => Escape(row.Get(c.Key)));
            sb.AppendLine(string.Join(",", values));
        }

        await File.WriteAllTextAsync(dlg.FileName, sb.ToString(), new UTF8Encoding(encoderShouldEmitUTF8Identifier: true));
    }

    public static List<(string Header, Func<StandardListRow, string> Value)> BuildPrintColumns(
        IReadOnlyList<ListColumnDef> allColumns,
        IReadOnlyList<string> visibleKeys) =>
        BuildColumns(allColumns, visibleKeys)
            .Select(c => (c.Header, new Func<StandardListRow, string>(r => r.Get(c.Key))))
            .ToList();

    private static List<(string Key, string Header)> BuildColumns(
        IReadOnlyList<ListColumnDef> allColumns,
        IReadOnlyList<string> visibleKeys)
    {
        var map = allColumns.ToDictionary(c => c.Key, c => c.Header, StringComparer.OrdinalIgnoreCase);
        var list = new List<(string, string)>();
        foreach (var key in visibleKeys)
        {
            if (map.TryGetValue(key, out var header))
                list.Add((key, header));
        }

        return list;
    }

    private static string Escape(string? value)
    {
        var s = value ?? string.Empty;
        if (s.Contains('"') || s.Contains(',') || s.Contains('\n'))
            return $"\"{s.Replace("\"", "\"\"")}\"";
        return s;
    }
}
