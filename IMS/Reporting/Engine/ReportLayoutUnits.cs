using System.Windows;
using System.Windows.Media;
using IMS.Reporting.Models;

namespace IMS.Reporting.Engine;

public static class ReportLayoutUnits
{
    private const double MmPerInch = 25.4;
    private const double Dpi = 96;

    public static double MmToDips(double mm) => mm / MmPerInch * Dpi;

    public static Size PageSizeDips(ReportPageSettings page) =>
        new(MmToDips(page.WidthMm), MmToDips(page.HeightMm));

    public static Thickness MarginsDips(ReportMarginsMm margin) =>
        new(
            MmToDips(margin.Left),
            MmToDips(margin.Top),
            MmToDips(margin.Right),
            MmToDips(margin.Bottom));

    public static Brush ParseBrush(string? hex, Brush fallback)
    {
        if (string.IsNullOrWhiteSpace(hex))
            return fallback;
        try
        {
            var color = (Color)ColorConverter.ConvertFromString(hex.Trim())!;
            return new SolidColorBrush(color);
        }
        catch
        {
            return fallback;
        }
    }

    public static TextAlignment ParseAlignment(string? align) =>
        align?.Trim().ToLowerInvariant() switch
        {
            "center" => TextAlignment.Center,
            "right" => TextAlignment.Right,
            _ => TextAlignment.Left
        };

    public static FontWeight ParseFontWeight(string? weight) =>
        string.Equals(weight, "bold", StringComparison.OrdinalIgnoreCase)
            ? FontWeights.Bold
            : FontWeights.Normal;
}
