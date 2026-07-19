namespace IMS.Services;

public sealed record ListColumnDef(
    string Key,
    string Header,
    bool Mandatory = false,
    bool Sortable = true,
    bool IsAmount = false,
    double Width = double.NaN,
    string HorizontalAlignment = "Left");

public static class ListColumnCatalog
{
    public static IReadOnlyList<string> NormalizeVisibleKeys(
        IEnumerable<ListColumnDef> all,
        IEnumerable<string>? keys,
        IReadOnlyList<string> defaults)
    {
        var allowed = new HashSet<string>(all.Select(c => c.Key), StringComparer.OrdinalIgnoreCase);
        var mandatory = all.Where(c => c.Mandatory).Select(c => c.Key);
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
