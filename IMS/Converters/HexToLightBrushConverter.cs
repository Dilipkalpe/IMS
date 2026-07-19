using System.Globalization;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;

namespace IMS.Converters;

/// <summary>Light tinted brush from a hex accent color (stat card hover backgrounds).</summary>
public sealed class HexToLightBrushConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is not string hex || hex.Length < 7 || hex[0] != '#')
            return Application.Current?.TryFindResource("AccentLightBrush") as Brush ?? Brushes.WhiteSmoke;

        try
        {
            var color = (Color)ColorConverter.ConvertFromString(hex)!;
            byte alpha = 56;
            if (parameter is string opacityText && byte.TryParse(opacityText, out var parsed))
                alpha = parsed;

            var brush = new SolidColorBrush(Color.FromArgb(alpha, color.R, color.G, color.B));
            brush.Freeze();
            return brush;
        }
        catch
        {
            return Application.Current?.TryFindResource("AccentLightBrush") as Brush ?? Brushes.WhiteSmoke;
        }
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
