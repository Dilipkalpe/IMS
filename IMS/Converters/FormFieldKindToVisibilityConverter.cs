using System.Globalization;
using System.Windows;
using System.Windows.Data;
using IMS.Models;

namespace IMS.Converters;

public sealed class FormFieldKindToVisibilityConverter : IValueConverter
{
    public FormFieldKind TargetKind { get; set; }

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        value is FormFieldKind kind && kind == TargetKind ? Visibility.Visible : Visibility.Collapsed;

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
