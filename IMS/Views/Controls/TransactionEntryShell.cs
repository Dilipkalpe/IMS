using System.Windows;
using System.Windows.Controls;

namespace IMS.Views.Controls;

public class TransactionEntryShell : ContentControl
{
    public static readonly DependencyProperty TitleProperty =
        DependencyProperty.Register(nameof(Title), typeof(string), typeof(TransactionEntryShell),
            new PropertyMetadata(string.Empty));

    public static readonly DependencyProperty TitleRightHeaderProperty =
        DependencyProperty.Register(nameof(TitleRightHeader), typeof(object), typeof(TransactionEntryShell),
            new PropertyMetadata(null));

    public static readonly DependencyProperty ContentMarginProperty =
        DependencyProperty.Register(nameof(ContentMargin), typeof(Thickness), typeof(TransactionEntryShell),
            new PropertyMetadata(new Thickness(4)));

    static TransactionEntryShell()
    {
        DefaultStyleKeyProperty.OverrideMetadata(typeof(TransactionEntryShell),
            new FrameworkPropertyMetadata(typeof(TransactionEntryShell)));
    }

    public string Title
    {
        get => (string)GetValue(TitleProperty);
        set => SetValue(TitleProperty, value);
    }

    public object? TitleRightHeader
    {
        get => GetValue(TitleRightHeaderProperty);
        set => SetValue(TitleRightHeaderProperty, value);
    }

    public Thickness ContentMargin
    {
        get => (Thickness)GetValue(ContentMarginProperty);
        set => SetValue(ContentMarginProperty, value);
    }
}
