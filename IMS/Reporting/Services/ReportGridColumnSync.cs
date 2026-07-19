using IMS.Reporting.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.Reporting.Services;

/// <summary>Applies Settings → Manage columns visibility to v2 table elements.</summary>
public static class ReportGridColumnSync
{
    private static readonly Dictionary<string, string> GridToPrintKey = new(StringComparer.OrdinalIgnoreCase)
    {
        ["sr"] = "srNo",
        ["code"] = "itemCode",
        ["description"] = "description",
        ["qty"] = "qty",
        ["rate"] = "rate",
        ["amount"] = "amount",
        ["disc"] = "discount",
        ["gst"] = "gstPercent"
    };

    public static async Task ApplyOrganizationColumnVisibilityAsync(
        ReportLayoutDocument layout,
        string moduleKey)
    {
        if (!ImsApiClient.IsAvailable)
            return;

        var table = layout.Elements.FirstOrDefault(e =>
            string.Equals(e.Type, "table", StringComparison.OrdinalIgnoreCase));
        if (table?.Table is null || table.Table.Columns.Count == 0)
            return;

        try
        {
            var prefs = await ImsApiClient.GetGridColumnPreferencesAsync(moduleKey).ConfigureAwait(false);
            var visible = prefs?.GlobalVisibleColumnKeys ?? prefs?.VisibleColumnKeys;
            if (visible is null || visible.Count == 0)
                return;

            var printKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var key in visible)
            {
                if (GridToPrintKey.TryGetValue(key, out var mapped))
                    printKeys.Add(mapped);
                else
                    printKeys.Add(key);
            }

            foreach (var col in table.Table.Columns)
                col.Visible = printKeys.Contains(col.Key);
        }
        catch
        {
            /* keep designer defaults */
        }
    }
}
