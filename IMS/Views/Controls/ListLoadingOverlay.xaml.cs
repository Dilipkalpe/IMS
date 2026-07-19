using System.Windows;
using System.Windows.Controls;

namespace IMS.Views.Controls;

public partial class ListLoadingOverlay : UserControl
{
    public static readonly DependencyProperty TitleProperty =
        DependencyProperty.Register(nameof(Title), typeof(string), typeof(ListLoadingOverlay),
            new PropertyMetadata("Loading…"));

    public static readonly DependencyProperty SubtitleProperty =
        DependencyProperty.Register(nameof(Subtitle), typeof(string), typeof(ListLoadingOverlay),
            new PropertyMetadata("Please wait"));

    public ListLoadingOverlay()
    {
        InitializeComponent();
    }

    public string Title
    {
        get => (string)GetValue(TitleProperty);
        set => SetValue(TitleProperty, value);
    }

    public string Subtitle
    {
        get => (string)GetValue(SubtitleProperty);
        set => SetValue(SubtitleProperty, value);
    }
}
