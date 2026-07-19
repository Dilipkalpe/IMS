using System.Globalization;
using System.Windows.Data;
using IMS.Models;

namespace IMS.Converters;

public sealed class CellValueConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is not StandardListRow row || parameter is not string key)
            return string.Empty;
        return row.Get(key);
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
