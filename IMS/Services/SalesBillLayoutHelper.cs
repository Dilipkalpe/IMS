using System.Globalization;
using System.Windows;
using System.Windows.Media;
using IMS.Models;

namespace IMS.Services;

internal static class SalesBillLayoutHelper
{
    private const double MmPerInch = 25.4;
    private const double Dpi = 96;

    public static double MmToDips(double mm) => mm / MmPerInch * Dpi;

    public static Size PageSizeDips(SalesBillPageSettings page) =>
        new(MmToDips(page.WidthMm), MmToDips(page.HeightMm));

    public static Thickness PagePaddingDips(SalesBillMarginMm margin) =>
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
            var color = (Color)ColorConverter.ConvertFromString(hex.Trim());
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

    public static string ReplaceTokens(string? text, SalesBillPrintContext ctx)
    {
        if (string.IsNullOrEmpty(text))
            return string.Empty;
        return text
            .Replace("{{documentTitle}}", ctx.DocumentTitle, StringComparison.OrdinalIgnoreCase)
            .Replace("{{invoiceNo}}", ctx.InvoiceNo, StringComparison.OrdinalIgnoreCase)
            .Replace("{{customer}}", ctx.Customer, StringComparison.OrdinalIgnoreCase)
            .Replace("{{date}}", ctx.Date, StringComparison.OrdinalIgnoreCase);
    }
}

internal sealed class SalesBillPrintContext
{
    public required string DocumentTitle { get; init; }
    public required string InvoiceNo { get; init; }
    public required string Customer { get; init; }
    public required string Date { get; init; }
}
