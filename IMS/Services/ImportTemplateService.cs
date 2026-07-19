using System.IO;

namespace IMS.Services;

internal static class ImportTemplateService
{
    private static readonly IReadOnlyDictionary<string, string> TemplateFileByType =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["products"] = "IMS_Product_Import_Template.xlsx",
            ["accounts"] = "IMS_Account_Import_Template.xlsx",
            ["sales-invoices"] = "IMS_Sales_Invoice_Import_Template.xlsx",
            ["purchase-invoices"] = "IMS_Purchase_Invoice_Import_Template.xlsx"
        };

    public static bool TryGetBundledTemplatePath(string importType, out string path)
    {
        path = string.Empty;
        if (!TemplateFileByType.TryGetValue(importType, out var fileName))
            return false;

        var baseDir = Path.Combine(AppContext.BaseDirectory, "Assets", "ImportTemplates");
        var candidate = Path.Combine(baseDir, fileName);
        if (!File.Exists(candidate))
            return false;

        path = candidate;
        return true;
    }

    public static async Task<byte[]?> ReadBundledTemplateAsync(string importType)
    {
        if (!TryGetBundledTemplatePath(importType, out var path))
            return null;

        return await File.ReadAllBytesAsync(path);
    }
}
