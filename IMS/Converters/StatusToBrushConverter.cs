using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;

namespace IMS.Converters;

public sealed class StatusToBrushConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var brush = value?.ToString()?.ToUpperInvariant() switch
        {
            "GOOD" or "OK" or "ACTIVE" or "RUNNING" or "RELEASED" or "POSTED" or "CLOSED" or "READY" =>
                new SolidColorBrush(Color.FromRgb(0xD1, 0xFA, 0xE5)),
            "WARNING" or "LOW" or "OPEN" or "PENDING" or "PLANNED" or "DRAFT" or "REVIEW" or "DOWN" =>
                new SolidColorBrush(Color.FromRgb(0xFE, 0xF9, 0xC3)),
            "OUT" or "OVERDUE" =>
                new SolidColorBrush(Color.FromRgb(0xFE, 0xE2, 0xE2)),
            _ => new SolidColorBrush(Color.FromRgb(0xDC, 0xFC, 0xE7))
        };
        brush.Freeze();
        return brush;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
