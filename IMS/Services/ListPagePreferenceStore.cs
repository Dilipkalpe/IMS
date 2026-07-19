using System.IO;
using System.Text.Json;

namespace IMS.Services;

public sealed class ListPagePreferences
{
    public int PageSize { get; set; } = 25;
    public string SortField { get; set; } = string.Empty;
    public string SortDir { get; set; } = "desc";
    public string? SearchText { get; set; }
    public string? StatusFilter { get; set; }
}

public static class ListPagePreferenceStore
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    private static string FilePath(string moduleKey)
    {
        var dir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "IMS",
            "list-pages");
        Directory.CreateDirectory(dir);
        return Path.Combine(dir, $"{moduleKey}.json");
    }

    public static ListPagePreferences Load(string moduleKey, ListPagePreferences defaults)
    {
        try
        {
            var path = FilePath(moduleKey);
            if (!File.Exists(path))
                return defaults;

            var json = File.ReadAllText(path);
            var dto = JsonSerializer.Deserialize<ListPagePreferences>(json);
            if (dto is null)
                return defaults;

            if (dto.PageSize <= 0)
                dto.PageSize = defaults.PageSize;
            if (string.IsNullOrWhiteSpace(dto.SortField))
                dto.SortField = defaults.SortField;
            if (string.IsNullOrWhiteSpace(dto.SortDir))
                dto.SortDir = defaults.SortDir;
            return dto;
        }
        catch
        {
            return defaults;
        }
    }

    public static void Save(string moduleKey, ListPagePreferences prefs)
    {
        try
        {
            var path = FilePath(moduleKey);
            var json = JsonSerializer.Serialize(prefs, JsonOptions);
            File.WriteAllText(path, json);
        }
        catch
        {
            // ignore persistence errors
        }
    }
}
