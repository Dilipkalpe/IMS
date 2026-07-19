using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;

namespace IMS.Converters;

public sealed class StatusToForegroundConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var brush = value?.ToString()?.ToUpperInvariant() switch
        {
            "GOOD" or "OK" or "ACTIVE" or "RUNNING" or "RELEASED" or "POSTED" or "CLOSED" or "READY" =>
                new SolidColorBrush(Color.FromRgb(0x04, 0x78, 0x57)),
            "WARNING" or "LOW" or "OPEN" or "PENDING" or "PLANNED" or "DRAFT" or "REVIEW" or "DOWN" =>
                new SolidColorBrush(Color.FromRgb(0xCA, 0x8A, 0x04)),
            "OUT" or "OVERDUE" =>
                new SolidColorBrush(Color.FromRgb(0xDC, 0x26, 0x26)),
            _ => new SolidColorBrush(Color.FromRgb(0x16, 0x65, 0x34))
        };
        brush.Freeze();
        return brush;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
