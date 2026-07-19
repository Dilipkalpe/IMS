using System.Globalization;
using System.Windows.Data;

namespace IMS.Converters;

public sealed class SortGlyphConverter : IMultiValueConverter
{
    public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
    {
        if (values.Length < 2 || parameter is not string field)
            return "";

        var activeField = values[0]?.ToString() ?? "";
        var dir = values[1]?.ToString() ?? "";

        if (!string.Equals(activeField, field, StringComparison.OrdinalIgnoreCase))
            return "";

        return string.Equals(dir, "asc", StringComparison.OrdinalIgnoreCase) ? " ▲" : " ▼";
    }

    public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
