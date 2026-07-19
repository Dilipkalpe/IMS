namespace IMS.Services;

public sealed record FormFieldDefinition(
    string Key,
    string Label,
    Models.FormFieldKind Kind,
    bool IsRequired = false,
    bool IsOptional = false,
    string Placeholder = "",
    string? ToolTip = null,
    string? Section = null,
    IReadOnlyList<string>? Options = null,
    string? DefaultValue = null,
    bool HasBrowseButton = false);

public static class FormFieldCatalog
{
    public static IReadOnlyList<string> AllKeys(IEnumerable<FormFieldDefinition> all) =>
        all.Select(f => f.Key).ToList();

    public static IReadOnlyList<string> DefaultVisibleKeys(IEnumerable<FormFieldDefinition> all) =>
        AllKeys(all);

    public static IReadOnlyList<string> NormalizeVisibleKeys(
        IEnumerable<FormFieldDefinition> all,
        IEnumerable<string>? keys,
        IReadOnlyList<string> defaults)
    {
        var allowed = new HashSet<string>(all.Select(f => f.Key), StringComparer.OrdinalIgnoreCase);
        var mandatory = all.Where(f => f.IsRequired).Select(f => f.Key);
        var result = new List<string>();
        if (keys is not null)
        {
            foreach (var key in keys)
            {
                var k = key.Trim();
                if (allowed.Contains(k) && !result.Contains(k, StringComparer.OrdinalIgnoreCase))
                    result.Add(k);
            }
        }

        foreach (var m in mandatory)
        {
            if (!result.Contains(m, StringComparer.OrdinalIgnoreCase))
                result.Insert(0, m);
        }

        return result.Count > 0 ? result : defaults.ToList();
    }
}
