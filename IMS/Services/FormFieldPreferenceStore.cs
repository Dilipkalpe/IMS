using System.IO;
using System.Text.Json;

namespace IMS.Services;

public static class FormFieldPreferenceStore
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    private static string FilePath(string moduleKey)
    {
        var dir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "IMS",
            "form-fields");
        Directory.CreateDirectory(dir);
        return Path.Combine(dir, $"{moduleKey}.json");
    }

    public static IReadOnlyList<string> Load(
        string moduleKey,
        IReadOnlyList<FormFieldDefinition> allFields,
        IReadOnlyList<string> defaults)
    {
        try
        {
            var path = FilePath(moduleKey);
            if (!File.Exists(path))
                return defaults;

            var json = File.ReadAllText(path);
            var dto = JsonSerializer.Deserialize<FieldPrefsFile>(json);
            return dto?.VisibleKeys is { Count: > 0 }
                ? FormFieldCatalog.NormalizeVisibleKeys(allFields, dto.VisibleKeys, defaults)
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
        IReadOnlyList<FormFieldDefinition> allFields,
        IReadOnlyList<string> defaults)
    {
        var normalized = FormFieldCatalog.NormalizeVisibleKeys(allFields, visibleKeys, defaults);
        var path = FilePath(moduleKey);
        var json = JsonSerializer.Serialize(new FieldPrefsFile { VisibleKeys = normalized.ToList() }, JsonOptions);
        File.WriteAllText(path, json);
    }

    private sealed class FieldPrefsFile
    {
        public List<string> VisibleKeys { get; set; } = [];
    }
}
