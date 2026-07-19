using IMS.Reporting.Data;
using IMS.Reporting.Engine;
using IMS.Reporting.Models;

namespace IMS.Reporting.Services;

public static class ReportPaperSizeHelper
{
    public const string CustomPaperKey = "CUSTOM";

    public static void ApplyToLayout(
        ReportLayoutDocument layout,
        string paperSizeKey,
        string orientation,
        IReadOnlyList<ReportPaperSizeDto> catalog,
        bool useCustomPaper,
        ReportCustomPaperDto? customPaper)
    {
        layout.Page.PaperSizeKey = paperSizeKey;
        layout.Page.Orientation = orientation;

        if (useCustomPaper && customPaper?.WidthMm > 0 && customPaper.HeightMm > 0)
        {
            layout.Page.WidthMm = customPaper.WidthMm.Value;
            layout.Page.HeightMm = customPaper.HeightMm.Value;
            layout.Page.MarginsMm = new ReportMarginsMm
            {
                Top = customPaper.MarginsMm?.Top ?? 10,
                Right = customPaper.MarginsMm?.Right ?? 10,
                Bottom = customPaper.MarginsMm?.Bottom ?? 10,
                Left = customPaper.MarginsMm?.Left ?? 10
            };
            return;
        }

        var preset = catalog.FirstOrDefault(p =>
            string.Equals(p.Key, paperSizeKey, StringComparison.OrdinalIgnoreCase));
        if (preset is null)
            return;

        layout.Page.WidthMm = preset.WidthMm;
        layout.Page.HeightMm = preset.HeightMm;
        layout.Page.Orientation = preset.Orientation;
        layout.Page.MarginsMm = new ReportMarginsMm
        {
            Top = preset.MarginsMm?.Top ?? 10,
            Right = preset.MarginsMm?.Right ?? 10,
            Bottom = preset.MarginsMm?.Bottom ?? 10,
            Left = preset.MarginsMm?.Left ?? 10
        };
    }

    public static (double WidthDip, double HeightDip) CanvasSizeDips(ReportLayoutDocument layout) =>
        (
            ReportLayoutUnits.MmToDips(layout.Page.WidthMm),
            ReportLayoutUnits.MmToDips(layout.Page.HeightMm)
        );
}
