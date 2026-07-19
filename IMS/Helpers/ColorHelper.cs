using System.Windows.Media;

namespace IMS.Helpers;

public static class ColorHelper
{
    public static Brush BrushFromHex(string hex)
    {
        if (string.IsNullOrWhiteSpace(hex) || hex.Length < 7 || hex[0] != '#')
            return Brushes.Gray;

        try
        {
            var color = (Color)ColorConverter.ConvertFromString(hex)!;
            var brush = new SolidColorBrush(color);
            brush.Freeze();
            return brush;
        }
        catch
        {
            return Brushes.Gray;
        }
    }
}
