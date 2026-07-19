using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;

namespace IMS.Converters;

public sealed class HexToBrushConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var hex = value?.ToString()?.Trim();
        if (string.IsNullOrWhiteSpace(hex))
            return Brushes.Transparent;

        if (!hex.StartsWith('#'))
            hex = "#" + hex;

        try
        {
            var color = (Color)ColorConverter.ConvertFromString(hex)!;
            return new SolidColorBrush(color);
        }
        catch
        {
            return new SolidColorBrush(Color.FromRgb(226, 232, 240));
        }
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        Binding.DoNothing;
}
