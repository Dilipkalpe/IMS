using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;

namespace IMS.Converters;

public sealed class BoolToBrushConverter : IValueConverter
{
    public Brush TrueBrush { get; set; } = Brushes.Red;
    public Brush FalseBrush { get; set; } = Brushes.Black;

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        value is true ? TrueBrush : FalseBrush;

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
