using IMS.Models;

namespace IMS.Services;

public static class BillFormatPaperCatalog
{
    public static void ApplyPreset(SalesBillLayoutDefinition layout, BillFormatPaperPreset preset)
    {
        layout.Page.SizeKey = preset.SizeKey;
        layout.Page.WidthMm = preset.WidthMm;
        layout.Page.HeightMm = preset.HeightMm;
        layout.Page.Orientation = preset.Orientation;
    }

    public static BillFormatPaperPreset? FindPreset(BillFormatCatalogDto? catalog, string key) =>
        catalog?.PaperPresets.FirstOrDefault(p =>
            string.Equals(p.Key, key, StringComparison.OrdinalIgnoreCase));
}
