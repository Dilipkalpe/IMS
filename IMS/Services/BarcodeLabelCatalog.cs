using IMS.Models;

namespace IMS.Services;

public static class BarcodeLabelCatalog
{
    public const string CustomFormatId = "custom";

    public static BarcodeLabelFormat Default => Formats.First(f => f.Id == "sheet_30");

    public static IReadOnlyList<BarcodeLabelFormat> Formats { get; } =
    [
        Sheet("sheet_65", "65-Per-Sheet", 38, 21, 5, 13, "Small products, jewelry, cosmetics"),
        Sheet("sheet_44", "44-Per-Sheet", 48.5, 25.4, 4, 11, "General retail products, online sellers"),
        Sheet("sheet_40", "40-Per-Sheet", 52.5, 29.7, 4, 10, "Product barcode labels, inventory"),
        Sheet("sheet_30", "30-Per-Sheet ⭐", 70, 29.7, 3, 10, "Products with SKU + Barcode + Price"),
        Sheet("sheet_24", "24-Per-Sheet", 64, 34, 3, 8, "Address labels, folders, medium packages"),
        Sheet("sheet_21", "21-Per-Sheet ⭐", 63.5, 38.1, 3, 7, "Warehouse and inventory labels"),
        Sheet("sheet_16", "16-Per-Sheet", 99, 34, 2, 8, "Asset tracking, shelf labels"),
        Sheet("sheet_14", "14-Per-Sheet ⭐", 99, 38, 2, 7, "Large product labels"),
        Sheet("sheet_10", "10-Per-Sheet", 99, 57, 2, 5, "Shipping boxes, bulk packaging"),
        Sheet("sheet_8", "8-Per-Sheet ⭐", 105, 74, 2, 4, "Cartons and warehouse labels"),
        Sheet("sheet_4", "4-Per-Sheet ⭐", 105, 148, 2, 2, "Large shipping labels and notices"),
        Sheet("sheet_2", "2-Per-Sheet ⭐", 210, 148, 1, 2, "Half-page labels"),
        Sheet("sheet_1", "1-Per-Sheet", 210, 297, 1, 1, "Full-page custom labels"),
        new()
        {
            Id = CustomFormatId,
            DisplayName = "Custom size",
            Description = "Enter label width and height in millimetres below",
            WidthMm = 50,
            HeightMm = 25,
            ColumnsPerPage = 2,
            RowsPerPage = 10
        }
    ];

    public static BarcodeLabelFormat? FindById(string? id) =>
        string.IsNullOrWhiteSpace(id)
            ? null
            : Formats.FirstOrDefault(f => f.Id.Equals(id, StringComparison.OrdinalIgnoreCase));

    public static BarcodeLabelFormat BuildCustomFormat(double widthMm, double heightMm)
    {
        var layout = ComputeA4Layout(widthMm, heightMm);
        return new BarcodeLabelFormat
        {
            Id = CustomFormatId,
            DisplayName = "Custom size",
            Description = $"Custom — {widthMm:0.#} × {heightMm:0.#} mm ({layout.Columns}×{layout.Rows} per sheet)",
            WidthMm = widthMm,
            HeightMm = heightMm,
            ColumnsPerPage = layout.Columns,
            RowsPerPage = layout.Rows
        };
    }

    public static (int Columns, int Rows) ComputeA4Layout(double widthMm, double heightMm)
    {
        const double pageW = 210;
        const double pageH = 297;
        const double margin = 8;
        const double gap = 2;
        var usableW = pageW - margin * 2;
        var usableH = pageH - margin * 2;
        var cols = Math.Max(1, (int)Math.Floor((usableW + gap) / (widthMm + gap)));
        var rows = Math.Max(1, (int)Math.Floor((usableH + gap) / (heightMm + gap)));
        return (cols, rows);
    }

    private static BarcodeLabelFormat Sheet(
        string id,
        string displayName,
        double widthMm,
        double heightMm,
        int cols,
        int rows,
        string description) =>
        new()
        {
            Id = id,
            DisplayName = displayName,
            Description = description,
            WidthMm = widthMm,
            HeightMm = heightMm,
            ColumnsPerPage = cols,
            RowsPerPage = rows
        };
}
