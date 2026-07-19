using System.IO;
using System.Text.Json;

namespace IMS.Services;

public static class ListColumnPreferenceStore
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    private static string FilePath(string moduleKey)
    {
        var dir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "IMS",
            "list-columns");
        Directory.CreateDirectory(dir);
        return Path.Combine(dir, $"{moduleKey}.json");
    }

    public static IReadOnlyList<string> Load(
        string moduleKey,
        IReadOnlyList<ListColumnDef> allColumns,
        IReadOnlyList<string> defaults)
    {
        try
        {
            var path = FilePath(moduleKey);
            if (!File.Exists(path))
                return defaults;

            var json = File.ReadAllText(path);
            var dto = JsonSerializer.Deserialize<ColumnPrefsFile>(json);
            return dto?.VisibleKeys is { Count: > 0 }
                ? ListColumnCatalog.NormalizeVisibleKeys(allColumns, dto.VisibleKeys, defaults)
                : defaults;
        }
        catch
        {
            return defaults;
        }
    }

    public static void Save(
        string moduleKey,
        IEnumerable<string> visibleKeys,
        IReadOnlyList<ListColumnDef> allColumns,
        IReadOnlyList<string> defaults)
    {
        var normalized = ListColumnCatalog.NormalizeVisibleKeys(allColumns, visibleKeys, defaults);
        var path = FilePath(moduleKey);
        var json = JsonSerializer.Serialize(new ColumnPrefsFile { VisibleKeys = normalized.ToList() }, JsonOptions);
        File.WriteAllText(path, json);
    }

    private sealed class ColumnPrefsFile
    {
        public List<string> VisibleKeys { get; set; } = [];
    }
}
